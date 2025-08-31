import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    // NextAuth
    AUTH_SECRET: z.string(),
    
    // Database
    // Use string (not URL) so we can support Unix socket DSNs like:
    // postgresql://user:pass@/db?host=/cloudsql/project:region:instance&sslmode=disable
    DATABASE_URL: z.string(),
    
    // Cloud SQL Connector
    CLOUD_SQL_CONNECTION_NAME: z.string().optional(), // format: project:region:instance
    DB_USER: z.string().optional(),
    DB_PASS: z.string().optional(), 
    DB_NAME: z.string().optional(),
    
    // Wise API
    WISE_CLIENT_ID: z.string(),
    WISE_CLIENT_SECRET: z.string(),
    WISE_REDIRECT_URI: z.string().url(),
    
    // Environment
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // Add client-side env vars here when needed
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    CLOUD_SQL_CONNECTION_NAME: process.env.CLOUD_SQL_CONNECTION_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASS: process.env.DB_PASS,
    DB_NAME: process.env.DB_NAME,
    WISE_CLIENT_ID: process.env.WISE_CLIENT_ID,
    WISE_CLIENT_SECRET: process.env.WISE_CLIENT_SECRET,
    WISE_REDIRECT_URI: process.env.WISE_REDIRECT_URI,
    NODE_ENV: process.env.NODE_ENV,
  },
  
  /**
   * Run `build` or `dev` with SKIP_ENV_VALIDATION to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
