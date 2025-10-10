/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { initTRPC, TRPCError } from "@trpc/server";
import axios from "axios";
import { eq } from "drizzle-orm";
import superjson from "superjson";
import { z, ZodError } from "zod/v4";

import type { Auth } from "@acme/auth";
import { db } from "@acme/db/client";
import { wiseSession as WiseSessionTable } from "@acme/db/schema";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */

export type CookieSameSite = "lax" | "strict" | "none";

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: CookieSameSite;
  path?: string;
  maxAge?: number; // seconds
  domain?: string;
}

const serializeCookie = (
  name: string,
  value: string,
  options: CookieOptions = {},
) => {
  const segments: string[] = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
  ];

  if (options.maxAge !== undefined) {
    const maxAge = Math.max(0, Math.floor(options.maxAge));
    segments.push(`Max-Age=${maxAge}`);
  }
  if (options.domain) segments.push(`Domain=${options.domain}`);
  if (options.path) segments.push(`Path=${options.path}`);
  else segments.push("Path=/");

  const sameSite = options.sameSite ?? "lax";
  const sameSiteToken =
    sameSite === "none" ? "None" : sameSite === "strict" ? "Strict" : "Lax";
  segments.push(`SameSite=${sameSiteToken}`);

  if (options.httpOnly !== false) segments.push("HttpOnly");
  if (options.secure !== false) segments.push("Secure");

  return segments.join("; ");
};

export const createTRPCContext = async (opts: {
  headers: Headers;
  auth: Auth;
  req: Request;
  res: Response;
}) => {
  const authApi = opts.auth.api;
  const session = await authApi.getSession({
    headers: opts.headers,
  });
  const setCookieHeaders: string[] = [];
  const setCookie = (name: string, value: string, options?: CookieOptions) => {
    setCookieHeaders.push(serializeCookie(name, value, options));
  };

  // Parse inbound cookies to initialize per-request user preferences
  const cookieHeader = opts.headers.get("cookie") ?? "";
  const cookieMap: Record<string, string> = {};
  if (cookieHeader) {
    for (const pair of cookieHeader.split(/;\s*/)) {
      const idx = pair.indexOf("=");
      if (idx > 0) {
        const key = decodeURIComponent(pair.slice(0, idx));
        const val = decodeURIComponent(pair.slice(idx + 1));
        cookieMap[key] = val;
      }
    }
  }

  const user = {
    targetCurrency: cookieMap["__Host-Currency"] as string | undefined,
    regCode: cookieMap["__Host-regCode"] as string | undefined,
  } as { targetCurrency: string; regCode: string };
  const wiseSessionId = cookieMap["__Host-session"] as string | undefined;

  return {
    authApi,
    session,
    db,
    setCookie,
    setCookieHeaders,
    user,
    wiseSessionId,
  };
};
/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError
          ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
          : null,
    },
  }),
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an articifial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev 100-500ms
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

/**
 * Wise-protected (requires Wise session cookie) procedure
 * Loads the Wise session row into context as `wiseSession`.
 */
export const wiseProtectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next }) => {
    const sessionId = ctx.wiseSessionId;
    if (!sessionId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const rows = await ctx.db
      .select()
      .from(WiseSessionTable)
      .where(eq(WiseSessionTable.id, sessionId))
      .limit(1);
    let wiseSession = rows[0];
    if (!wiseSession) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Token refresh framework
    interface WiseTokenResponse {
      access_token: string;
      token_type: string;
      refresh_token: string;
      expires_in: number;
      expires_at: number; // epoch seconds
      refresh_expires_at: number; // epoch seconds
      refresh_token_expires_in: number;
      scope?: string;
      created_at: number; // epoch seconds
    }

    const toDate = (epochSeconds: number) => new Date(epochSeconds * 1000);
    const nowMs = Date.now();
    const accessExpiresMs = new Date(wiseSession.expires_at).getTime();
    const needsRefresh = accessExpiresMs <= nowMs + 60_000; // refresh if expired or expiring in 60s

    if (needsRefresh) {
      try {
        const res = await axios.post<WiseTokenResponse>(
          "https://api.sandbox.transferwise.tech/oauth/token",
          new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: wiseSession.refreshToken,
          }),
          {
            auth: {
              username: process.env.WISE_CLIENT_ID ?? "",
              password: process.env.WISE_CLIENT_SECRET ?? "",
            },
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        );

        const refreshed = res.data;
        const refreshExpiresAt = toDate(refreshed.refresh_expires_at);

        await ctx.db
          .update(WiseSessionTable)
          .set({
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token,
            expires_in: refreshed.expires_in,
            expires_at: toDate(refreshed.expires_at),
            refresh_expires_at: refreshExpiresAt,
            refresh_token_expires_in: refreshed.refresh_token_expires_in,
            scope: refreshed.scope,
            // created_at remains original issuance time
          })
          .where(eq(WiseSessionTable.id, sessionId));

        // Extend session cookie TTL to match refresh lifetime remaining
        const maxAgeSeconds = Math.max(
          0,
          Math.floor((refreshExpiresAt.getTime() - Date.now()) / 1000),
        );
        ctx.setCookie("__Host-session", sessionId, {
          sameSite: "lax",
          path: "/",
          maxAge: maxAgeSeconds || 60 * 60 * 24,
        });

        // Update in-memory session for downstream handlers
        wiseSession = {
          ...wiseSession,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          expires_in: refreshed.expires_in,
          expires_at: toDate(refreshed.expires_at),
          refresh_expires_at: refreshExpiresAt,
          refresh_token_expires_in: refreshed.refresh_token_expires_in,
          scope: refreshed.scope,
        } as typeof wiseSession;
      } catch {
        // If refresh fails, revoke session
        await ctx.db
          .delete(WiseSessionTable)
          .where(eq(WiseSessionTable.id, sessionId));
        ctx.setCookie("__Host-session", "", { path: "/", maxAge: 0 });
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
    }

    return next({
      ctx: {
        wiseSession,
      },
    });
  });
