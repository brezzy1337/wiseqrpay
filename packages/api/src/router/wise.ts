import { randomUUID } from "crypto";
import axios from "axios";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import type { WiseRequirementsResponse } from "@acme/validators";
import { registrationCode, user, wiseSession } from "@acme/db/schema";
import { currencyEnum, dynamicRecipentSchema } from "@acme/validators";

import {
  createTRPCRouter,
  publicProcedure,
  wiseProtectedProcedure,
} from "../trpc";
import { parseWiseError } from "../types/wise.types";
import { generateAndHashRegistrationCode } from "../utils/registration-code";

// There are a few changes chatGPT 5 decided to do when migrating the project over to https://github.com/t3-oss/create-t3-turbo.
// My main concern is the loss of dynamic schema capacity, which could leave some currency combinations unserviced, or error prone.
// TODO: Cross anaylsis the migrated api code from the orginal code base.

export const wiseRouter = createTRPCRouter({
  // Generate a secure registration code for new user sign-up
  // Returns the plain code to be stored in a secure, HttpOnly cookie
  // UI used post concurrent to signup. Needs to genereate access token.
  generateRegistrationCode: publicProcedure
    .input(
      z.object({
        email: z.email(),
      }),
    )
    .mutation(({ input, ctx }) => {
      // Generate a cryptographically secure registration code
      //TODO: Check if this registation workflow is complaiant with best practice.
      // I dont think it is because I'm storing a unhashed code as a cookie.
      // I could encrypt the code and store in the database, and use a secret key
      // stored on my GCP secret manager to decrypt the code before using it.
      // Rotating this decryption key in the GCP could be a whole other layer of security.
      const { code, hashedCode: _hashedCode } =
        generateAndHashRegistrationCode();

      // Create an expiration time (15 minutes from now)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // TODO: Store in database
      // await ctx.db.insert(registrationCode).values({
      //   id: randomBytes(16).toString('hex'),
      //   email: input.email,
      //   hashedCode: _hashedCode,
      //   expiresAt: expiresAt,
      // });

      // Store the plain registration code in a secure, HttpOnly cookie
      // This allows the code to be sent with subsequent requests
      ctx.setCookie("__Host-regCode", code, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15, // 15 minutes
      });

      // Return confirmation (never return the code itself in response body)
      return {
        success: true,
        email: input.email,
        expiresAt: expiresAt.toISOString(),
        message:
          "Registration code generated. Please complete registration within 15 minutes.",
      };
    }),

  // Create a new user using the registration code
  // Steps below are dirieved from the following Wise API documentation: https://docs.wise.com/api-docs/guides/customer-prefilled-account-wise-kyc
  // Step 1: Get Client Token
  // Step 2: Create User with registration code (do I need to keep the registration code in the database?)
  // Step 3: Get User Token
  // Step 4: Create Personal / Bussiness Profile / Directors/ UBO / Verification
  // Step 5: Generate Claim Account Code (registration code)

  createUser: publicProcedure
    .input(
      z.object({
        email: z.email(),
        registatrationCode: z.string(),
        language: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Obtains a access token by passing Client Id & Secret to Wise
      // I may want to consider saving the access token as a cookie or something else that can be accessed.
      const tokenRes = await axios.post<{
        client_token: string;
        token_type: string;
        expires_in: number;
        scope?: string;
      }>(
        "https://api.sandbox.transferwise.tech/oauth/token",
        new URLSearchParams({ grant_type: "client_credentials" }),
        {
          // WISE_CLIENT_ID:CLIENT_SECRET must be stored in backend env, not accessable to the frontend. We will leverage GCP secret manager to store these values.
          auth: {
            username: process.env.WISE_CLIENT_ID ?? "",
            password: process.env.WISE_CLIENT_SECRET ?? "",
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );
      // For access token storage we will be referring to BFF Pattern: https://auth0.com/blog/the-backend-for-frontend-pattern-bff/#SPA-Security-and-Tokens
      // Store access token as an HttpOnly, Secure cookie (short TTL). For production, prefer
      // storing only a refresh token in a cookie and keep access tokens in-memory.

      // Honestly I want to tie this to Google OAuth. This means that uses can create a user using Google OAuth flow which is very convient and has a built in layer of security.
      const accessToken = tokenRes.data.client_token;

      try {
        // Send a request to post a user, has a built in user check
        const userResponse = await axios.post<{
          id: string;
          name: string;
          email: string;
          active: boolean;
          details: Record<string, unknown>;
        }>(
          "https://api.sandbox.transferwise.tech/v1/user/signup/registration_code",
          input,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "Accept-Minor-Version": "1",
            },
          },
        );

        if (userResponse.status !== 200) {
          throw new Error("Failed to create user");
        }

        // Store the user in the database
        await ctx.db.insert(user).values({
          id: userResponse.data.id,
          email: userResponse.data.email,
          emailVerified: false,
          isBusiness: false,
          name: userResponse.data.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Tell user to keep registration code for future use.
        await ctx.db.insert(registrationCode).values({
          id: userResponse.data.id,
          email: userResponse.data.email,
          hashedCode: ctx.user.regCode,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          used: false,
        });

        const userToken = await axios.post<{
          access_token: string;
          token_type: string;
          refresh_token: string;
          expires_in: number;
          expires_at: number;
          refresh_expires_at: number;
          refresh_token_expires_in: number;
          scope?: string;
          created_at: number;
        }>(
          "https://api.sandbox.transferwise.tech/oauth/token",
          new URLSearchParams({
            grant_type: "authorization_code",
            code: ctx.user.regCode,
          }),
          {
            auth: {
              username: process.env.WISE_CLIENT_ID ?? "",
              password: process.env.WISE_CLIENT_SECRET ?? "",
            },
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            params: {
              grant_type: "authorization_code",
              client_id: process.env.WISE_CLIENT_ID ?? "",
              code: ctx.user.regCode, // Needs to be unhahsed
              redirect_uri: process.env.WISE_REDIRECT_URL ?? "",
            },
          },
        );

        if (userToken.status !== 200) {
          throw new Error("Failed to get user token");
        }

        // Persist Wise token bundle as a server-side session
        const sessionId = randomUUID();
        const toDate = (epochSeconds: number) => new Date(epochSeconds * 1000);
        const refreshExpiresAt = toDate(userToken.data.refresh_expires_at);

        // Todo: Cache in redis in production.
        await ctx.db.insert(wiseSession).values({
          id: sessionId,
          userId: userResponse.data.id,
          accessToken: userToken.data.access_token,
          refreshToken: userToken.data.refresh_token,
          expires_in: userToken.data.expires_in,
          expires_at: toDate(userToken.data.expires_at),
          refresh_expires_at: refreshExpiresAt,
          refresh_token_expires_in: userToken.data.refresh_token_expires_in,
          scope: userToken.data.scope,
          created_at: toDate(userToken.data.created_at),
        });

        // Issue HttpOnly session cookie scoped to refresh token lifetime
        const maxAgeSeconds = Math.max(
          0,
          Math.floor((refreshExpiresAt.getTime() - Date.now()) / 1000),
        );
        ctx.setCookie("__Host-session", sessionId, {
          sameSite: "lax",
          path: "/",
          maxAge: maxAgeSeconds || 60 * 60 * 24, // fallback 1 day
        });

        return {
          success: true,
          message: "User created successfully",
        };
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const { code, message } = parseWiseError(error.response?.data);
          switch (status) {
            case 409:
              return { success: false, error: message, code };
            case 400:
              return { success: false, error: message, code };
            case 401:
            case 403:
              return { success: false, error: message, code };
            case 500:
            default:
              return {
                success: false,
                error: message || "Request failed",
                code,
              };
          }
        }
        throw error;
      }
    }),

  createBusinessProfile: wiseProtectedProcedure
    .input(
      z.object({
        businessName: z.string(),
        businessNameInKatakana: z.string().optional(),
        businessFreeFormDescription: z.string(),
        registrationNumber: z.string(),
        acn: z.string().optional(),
        abn: z.string().optional(),
        arbn: z.string().optional(),
        companyType: z.enum([
          "LIMITED_PARTNERSHIP",
          "SOLE_TRADER",
          "LIMITED_BY_GUARANTEE",
          "LIMITED_LIABILITY_COMPANY",
          "FOR_PROFIT_CORPORATION",
          "NON_PROFIT_CORPORATION",
          "LIMITED_LIABILITY_PARTNERSHIP",
          "GENERAL_PARTNERSHIP",
          "SOLE_PROPRIETORSHIP",
          "PRIVATE_LIMITED_COMPANY",
          "PUBLIC_LIMITED_COMPANY",
          "TRUST",
          "OTHER",
        ]),
        companyRole: z.enum(["OWNER", "DIRECTOR", "OTHER"]),
        address: z
          .object({
            addressFirstLine: z.string(),
            city: z.string(),
            countryIso2Code: z.string().length(2),
            countryIso3Code: z.string().length(3).toLowerCase(),
            postCode: z.string(),
            stateCode: z.string().max(5).optional(),
          })
          .refine(
            (address) => {
              const requires = ["usa", "can", "bra", "aus"];
              if (requires.includes(address.countryIso3Code.toLowerCase())) {
                return Boolean(address.stateCode);
              }
              return true;
            },
            {
              message: "State code is required for selected country",
              path: ["stateCode"],
            },
          ),
        externalCustomerId: z.string(),
        actorEmail: z.email(),
        firstLevelCategory: z.string(),
        secondLevelCategory: z.string(),
        operationalAddresses: z.array(
          z.object({
            addressFirstLine: z.string(),
            city: z.string(),
            countryIso2Code: z.string().length(2),
            countryIso3Code: z.string().length(3).toLowerCase(),
            postCode: z.string(),
            stateCode: z.string().optional(),
          }),
        ),
        webpage: z.url(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const response = await axios.post(
        "https://api.wise.com/v2/profiles",
        {
          type: "business",
          details: {
            name: input.businessName,
            nameInKatakana: input.businessNameInKatakana,
            description: input.businessFreeFormDescription,
            registrationNumber: input.registrationNumber,
            acn: input.acn,
            abn: input.abn,
            arbn: input.arbn,
            companyType: input.companyType,
            companyRole: input.companyRole,
            webpage: input.webpage,
            firstLevelCategory: input.firstLevelCategory,
            secondLevelCategory: input.secondLevelCategory,
          },
          address: {
            ...input.address,
            countryIso2Code: input.address.countryIso2Code,
          },
          operationalAddresses: input.operationalAddresses,
          externalCustomerId: input.externalCustomerId,
          actorEmail: input.actorEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${ctx.wiseSession.accessToken}`,
            "Content-Type": "application/json",
            "Accept-Minor-Version": "1",
          },
        },
      );
      // Todo: Store the profile id in the database.
      return response.data;
    }),

  getRecipientRequirments: publicProcedure
    // this will generate the inital form based of the requriements. We have to recall this in the createRecipeint but in the future we can store the response in the s
    .input(
      z.object({
        targetCurrency: currencyEnum,
        // Lets call this max transaction amount and set it to a default resonable limit. Probably $500.
        type: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Persist the user's preferred target currency in a cookie for subsequent requests
      ctx.setCookie("__Host-Currency", input.targetCurrency, {
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      // Step 1: Get Requiements for recipients based on source and target currency
      const response = await axios.get<WiseRequirementsResponse>(
        "https://api.wise.com/v1/account-requirements",
        {
          params: {
            // target currency can change the bank account data required for transactions.
            // It's best collect all possible data for each currency eventually.
            // We have to consider the user experience, the least effort the form is the better.
            // That's why I actually like the idea of linking google bussiness data to this WiseQRPay
            // as a requirement because we can infer alot of validation from google if that's the case
            // at least thoertically.
            source: "USD",
            target: ctx.user.targetCurrency,
            sourceAmount: 100,
          },
          headers: {
            "Content-Type": "application/json",
            "Accept-Minor-Version": "1",
          },
        },
      );

      return {
        requirements: response.data,
      };
    }),

  createRecipient: wiseProtectedProcedure
    // After creating a recipient we have to store the recipent account Id.
    // This is so that the QR can point to the data location of the database.
    // Target Currnecy (currency of the merchant) and be temporarily stored in the database. I believe wise should hold the recipts.
    //todo: I need to dyncamilly create inputs based on the requirements returned.
    .input(
      z.object({
        accountHolderName: z.string(),
        type: z.string(),
        details: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Stateless approach: re-fetch requirements with the same invariants
      const requirementsRes = await axios.get<WiseRequirementsResponse>(
        "https://api.wise.com/v1/account-requirements",
        {
          params: {
            source: "USD",
            target: ctx.user.targetCurrency,
            sourceAmount: 1000,
          },
          headers: {
            "Content-Type": "application/json",
            "Accept-Minor-Version": "1",
          },
        },
      );

      // Build schema and validate provided details
      const schema = dynamicRecipentSchema(requirementsRes.data);
      const detailsResult = schema.safeParse(input.details);
      if (!detailsResult.success) {
        throw new Error(`Invalid input: ${detailsResult.error.message}`);
      }
      const validatedDetails = detailsResult.data as Record<string, unknown>;

      const { data: profiles } = await axios.get(
        "https://api.wise.com/v1/profiles",
        {
          headers: {
            Authorization: `Bearer ${ctx.wiseSession.accessToken}`,
            "Content-Type": "application/json",
            "Accept-Minor-Version": "1",
          },
        },
      );

      // I'm not sure if the profileId is refering to the public, user, or general id.
      // I'll assume it's the publicId that's being reffered to.
      const profileId =
        (profiles as any[]).find((p) => p.type === "business")?.id ??
        (profiles as any[])[0]?.id;

      // Step 7: Create the recipent
      const { data: recipient } = await axios.post(
        "https://api.wise.com/v1/recipients",
        {
          profile: profileId,
          accountHolderName: input.accountHolderName,
          currency: "USD",
          type: input.type,
          details: validatedDetails,
        },
        {
          headers: {
            Authorization: `Bearer ${ctx.wiseSession.accessToken}`,
            "Content-Type": "application/json",
            "Accept-Minor-Version": "1",
          },
        },
      );

      return recipient;
    }),

  // Fetch current Wise session metadata (no secrets)
  getCurrentSession: wiseProtectedProcedure.query(({ ctx }) => {
    const session = ctx.wiseSession;
    return {
      id: session.id,
      userId: session.userId,
      scope: session.scope,
      expires_at: session.expires_at,
      refresh_expires_at: session.refresh_expires_at,
    };
  }),

  // Logout: delete Wise session and clear cookie
  logout: wiseProtectedProcedure.mutation(async ({ ctx }) => {
    const sessionId = ctx.wiseSession.id;
    if (sessionId) {
      await ctx.db.delete(wiseSession).where(eq(wiseSession.id, sessionId));
    }
    ctx.setCookie("__Host-session", "", { path: "/", maxAge: 0 });
    return { success: true };
  }),
});

//     // Generate QR code
//     const qrCode = await QRCode.toDataURL(transferData.payInUrl);
