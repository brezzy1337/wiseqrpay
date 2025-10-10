import axios from "axios";
import { z } from "zod/v4";

import type { WiseRequirementsResponse } from "@acme/validators";
import { currencyEnum, dynamicRecipentSchema } from "@acme/validators";

import { createTRPCRouter, publicProcedure } from "../trpc";

// There are a few changes chatGPT 5 decided to do when migrating the project over to https://github.com/t3-oss/create-t3-turbo.
// My main concern is the loss of dynamic schema capacity, which could leave some currency combinations unserviced, or error prone.
// TODO: Cross anaylsis the migrated api code from the orginal code base.

export const wiseRouter = createTRPCRouter({
  createUser: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        registatrationCode: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Obtains a access token by passing Client Id & Secret to Wise
      // I may want to consider saving the access token as a cookie or something else that can be accessed.
      const tokenRes = await axios.post<{
        access_token: string;
        token_type: string;
        expires_in: number;
        scope?: string;
      }>(
        "https://api.sandbox.transferwise.tech/oauth/token",
        new URLSearchParams({ grant_type: "client_credentials" }),
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
      // Store access token as an HttpOnly, Secure cookie (short TTL). For production, prefer
      // storing only a refresh token in a cookie and keep access tokens in-memory.

      // Honestly I want to tie this to Google OAuth. This means that uses can create a user using Google OAuth flow which is very convient and has a built in layer of security.
      const accessToken = tokenRes.data.access_token;
      // Best practice cookie attributes:
      // - HttpOnly, Secure defaulted in ctx.setCookie serializer
      // - SameSite=Lax to mitigate CSRF; adjust if cross-site needed
      // - Path scoped to refresh/auth routes if applicable; keep root for now
      // - Max-Age: keep short since this is an access token from Wise
      ctx.setCookie("__Host-wiseAccess", accessToken, {
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15, // 15 minutes
      });

      // Send a request to post a user, has a built in user check
      const userResponse = await axios.post<{
        id: string;
        name: string;
        email: string;
        active: boolean;
        // details: {} // Not sure what response structure of reply. Docs say it's empty.
      }>("https://api.sandbox.transferwise.tech/v1/users", input, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept-Minor-Version": "1",
        },
      });
      return userResponse.data;
    }),
  // createPersonalProfile: publicProcedure
  //   .input(
  //     z.object({
  //       firstName: z.string().max(30),
  //       lastName: z.string().max(30),
  //       preferredName: z.string().max(30).optional(),
  //       nationality: z.string().length(3).toLowerCase(),
  //       dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  //       externalCustomerId: z.string().optional(),
  //       address: z
  //         .object({
  //           addressFirstLine: z.string(),
  //           city: z.string(),
  //           countryIso3Code: z.string().length(3).toLowerCase(),
  //           postCode: z.string(),
  //           stateCode: z.string().max(5).optional(),
  //         })
  //         .refine(
  //           (address) => {
  //             const requires = ["usa", "can", "bra", "aus"];
  //             if (requires.includes(address.countryIso3Code.toLowerCase())) {
  //               return Boolean(address.stateCode);
  //             }
  //             return true;
  //           },
  //           {
  //             message: "State code is required for selected country",
  //             path: ["stateCode"],
  //           },
  //         ),
  //       contactDetails: z.object({
  //         email: z.email(),
  //         phoneNumber: z
  //           .string()
  //           .regex(/^\+[1-9]\d{1,14}$/u, "Invalid phone number format"),
  //       }),
  //       occupations: z
  //         .array(
  //           z.object({
  //             code: z.string(),
  //             format: z.literal("FREE_FORM"),
  //           }),
  //         )
  //         .optional(),
  //       details: z
  //         .object({
  //           firstNameInKana: z.string(),
  //           lastNameInKana: z.string(),
  //         })
  //         .optional(),
  //     }),
  //   )
  //   .mutation(async ({ input }) => {
  //     const response = await axios.post(
  //       "https://api.wise.com/v1/profiles",
  //       {
  //         firstName: input.firstName,
  //         lastName: input.lastName,
  //         preferredName: input.preferredName,
  //         nationality: input.nationality,
  //         dateOfBirth: input.dateOfBirth,
  //         externalCustomerId: input.externalCustomerId,
  //         address: input.address,
  //         contactDetails: input.contactDetails,
  //         occupations: input.occupations,
  //         ...(input.nationality === "jpn" && input.details
  //           ? { details: input.details }
  //           : {}),
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${process.env.WISE_CLIENT_SECRET}`,
  //         },
  //       },
  //     );
  //     // Todo: Create validation (Zod Schema) for a response to personal profile creation.
  //     return response.data;
  //   }),

  // Looking at the documentation the Bussiness Profile return object

  createBusinessProfile: publicProcedure
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
        actorEmail: z.string().email(),
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
        webpage: z.string().url(),
      }),
    )
    .mutation(async ({ input }) => {
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
            Authorization: `Bearer ${process.env.WISE_CLIENT_SECRET ?? ""}`,
            "Content-Type": "application/json",
            "Accept-Minor-Version": "1",
          },
        },
      );
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
      // Persist the user's preferred source currency in ctx and cookie
      ctx.setUserCurrency?.(input.targetCurrency);
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

  // getAllRecipientRequirments: publicProcedure
  //   .input(
  //     z.object({
  //       // Source comes from ctx if available; input allows override/first-set
  //       sourceCurrency: currencyEnum.optional(),
  //       type: z.string(),
  //       targets: z.array(currencyEnum).default(["USD", "EUR", "GBP"] as any),
  //     }),
  //   )
  //   .mutation(async ({ input, ctx }) => {
  //     const source = input.sourceCurrency ?? ctx.user.sourceCurrency;
  //     if (!source) throw new Error("sourceCurrency not set");
  //     if (!ctx.user.sourceCurrency) ctx.setUserSourceCurrency?.(source);

  //     const requirementsByTarget: Record<string, WiseRequirementsResponse> = {};
  //     await Promise.all(
  //       input.targets.map(async (target) => {
  //         const { data } = await axios.get<WiseRequirementsResponse>(
  //           "https://api.wise.com/v1/account-requirements",
  //           {
  //             params: { source, target, sourceAmount: 1000 },
  //             headers: {
  //               "Content-Type": "application/json",
  //               "Accept-Minor-Version": "1",
  //             },
  //           },
  //         );
  //         requirementsByTarget[target] = data;
  //       }),
  //     );

  //     return {
  //       sourceCurrency: source,
  //       type: input.type,
  //       requirementsByTarget,
  //     };
  //   }),

  // createRecipientsForTargets: publicProcedure
  //   .input(
  //     z.object({
  //       accountHolderName: z.string(),
  //       type: z.string(),
  //       detailsByTarget: z.record(
  //         currencyEnum,
  //         z.record(z.string(), z.unknown()),
  //       ),
  //     }),
  //   )
  //   .mutation(async ({ input, ctx }) => {
  //     const source = ctx.user.sourceCurrency;
  //     if (!source) throw new Error("sourceCurrency not set in ctx");

  //     // Fetch profile id once
  //     const { data: profiles } = await axios.get(
  //       "https://api.wise.com/v1/profiles",
  //       {
  //         headers: {
  //           Authorization: `Bearer ${process.env.WISE_CLIENT_ID}`,
  //           "Content-Type": "application/json",
  //           "Accept-Minor-Version": "1",
  //         },
  //       },
  //     );
  //     const profileId =
  //       (profiles as any[]).find((p) => p.type === "business")?.id ??
  //       (profiles as any[])[0]?.id;

  //     const results: { target: string; recipient: unknown }[] = [];
  //     for (const [target, details] of Object.entries(input.detailsByTarget)) {
  //       // Validate per target
  //       const { data: req } = await axios.get<WiseRequirementsResponse>(
  //         "https://api.wise.com/v1/account-requirements",
  //         {
  //           params: { source, target, sourceAmount: 1000 },
  //           headers: {
  //             "Content-Type": "application/json",
  //             "Accept-Minor-Version": "1",
  //           },
  //         },
  //       );
  //       const schema = dynamicRecipentSchema(req);
  //       const parsed = schema.safeParse(details);
  //       if (!parsed.success) {
  //         throw new Error(
  //           `Invalid input for ${target}: ${parsed.error.message}`,
  //         );
  //       }

  //       // Create recipient for this target
  //       const { data: recipient } = await axios.post(
  //         "https://api.wise.com/v1/recipients",
  //         {
  //           profile: profileId,
  //           accountHolderName: input.accountHolderName,
  //           currency: target,
  //           type: input.type,
  //           details: parsed.data,
  //         },
  //         {
  //           headers: {
  //             Authorization: `Bearer ${process.env.WISE_CLIENT_ID}`,
  //             "Content-Type": "application/json",
  //             "Accept-Minor-Version": "1",
  //           },
  //         },
  //       );

  //       results.push({ target, recipient });
  //     }

  //     return { created: results.length, results };
  //   }),

  createRecipient: publicProcedure
    // After creating a recipient we have to store the recipent account Id.
    // This is so that the QR can point to the data location of the database.
    // Target Currnecy (currency of the merchant) and be temporarily stored in the database. I believe wise should hold the recipts.
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

      // Step 4 Alternative with DB integration: Retrieve stored user input from DB after testing requests
      // Store recipient data into Cloud SQL (PostgreSQL) via prisma

      // const transaction = await prisma.userTransaction.findFirst({
      //   where: { userId: input.userId},
      // })

      // if (!transaction) throw new Error("No stored user data found");

      // const flattenedDetails = {
      //   ...transaction.recipientDetails.details,
      //   "address.country": transaction.recipientDetails.details.address?.country,
      //   "address.city": transaction.recipientDetails.details.address?.city,
      //   "address.firstLine": transaction.recipientDetails.details.address?.firstLine,
      //   "address.postCode": transaction.recipientDetails.details.address?.postCode,
      // };

      // // Step 5: Validate user input
      // const validated =  dynamicSchema.safeParse(flattenedDetails);
      // if (!validated.success) {
      //   console.error(validated.error.flatten());
      //   throw new Error("Validation failed");
      // }

      // const validatedDetails = validated.data;

      // Step 6: Fetch Wise profile ID
      // Need a way to grab the created profile ID from the user
      const { data: profiles } = await axios.get(
        "https://api.wise.com/v1/profiles",
        {
          headers: {
            Authorization: `Bearer ${process.env.WISE_CLIENT_ID}`,
            "Content-Type": "application/json",
            "Accept-Minor-Version": "1",
          },
        },
      );

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
            Authorization: `Bearer ${process.env.WISE_CLIENT_ID}`,
            "Content-Type": "application/json",
            "Accept-Minor-Version": "1",
          },
        },
      );
      // Step 8: Update transaction in DB
      // await prisma.userTransaction.update({
      //   where: { id: transaction.id },
      //   data: {
      //     recipientId: recipient.id,
      //     status: "READY_TO_PAY",
      //   },
      // });
      return recipient;
    }),
});

// createTransfer: publicProcedure
//   .input(z.object({
//     userId: z.string(),
//     recipientId: z.string(),
//     amount: z.number(),
//     currency: currencyEnum,
//   }))
//   .mutation(async ({ input }) => {
//     // Create transfer in Wise
//     const { data: transferData } = await axios.post(
//       "https://api.wise.com/v1/transfers",
//       {
//         targetAccount: input.recipientId,
//         source: input.currency,
//         target: input.currency,
//         sourceAmount: input.amount || undefined,
//         customerTransactionId: `txn_${Date.now()}`,
//       },
//       {
//         headers: {
//           "Authorization": `Bearer ${env.WISE_CLIENT_SECRET}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // Generate QR code
//     const qrCode = await QRCode.toDataURL(transferData.payInUrl);

//     // Store payment in database
//     const payment = await prisma.payment.create({
//       data: {
//         userId: input.userId,
//         recipientId: input.recipientId,
//         transferId: transferData.id,
//         paymentUrl: transferData.payInUrl,
//         qrCode: qrCode,
//         amount: input.amount,
//         currency: input.currency,
//        },
//     });
//     return {
//       ...payment,
//       qrCode,
//     };
//   });

//   getPayment: publicProcedure
//     .input(z.object({
//       paymentId: z.string(),
//     }))
//     .query(async ({ input }) => {
//       return prisma.payment.findUnique({
//         where: {
//           id: input.paymentId,
//         },
//       });
//     }),
// });
