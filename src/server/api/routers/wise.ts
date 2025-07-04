import { z, ZodObject } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc.ts";
import axios from "axios";
// import QRCode from "qrcode";
import { env } from "~/env.mjs";
// import { prisma } from "~/server/api/db";

// Import types and schemas from the new file
// For future use to clean up code.
import {
//   personalProfileSchema,
//   businessProfileSchema,
//   recipientSchema,
//   transferSchema,
//   paymentQuerySchema,
  currencyEnum
} from "~/types/wiseTypes.ts";

import { dynamicRecipentSchema, WiseRequirementsResponse } from "~/types/schema/dynamicRecipientSchema.ts";
// import { WiseRequirement } from '../../../types/schema/dynamicRecipientSchema';

// Define the type for first level categories;
type FirstLevelCategory = keyof typeof WISE_BUSINESS_CATEGORIES;

// Define the type for second level categories (union of all possible values)
type SecondLevelCategory = typeof WISE_BUSINESS_CATEGORIES[FirstLevelCategory][number];

// Create a type-safe validator for second level categories based on the first level category.
const createSecondLevelCategoryValidator = (firstLevel: FirstLevelCategory) => {
  const validCategories = WISE_BUSINESS_CATEGORIES[firstLevel];
  return z.enum(validCategories as [string, ...string[]]);
}

const WISE_BUSINESS_CATEGORIES = {
  "CHARITY": ["CHARITY_NON_PROFIT", "CHARITY_ALL_ACTIVITIES"],
  "CONSULTING_AND_SERVICES": [
    "CONSULTING_IT_BUSINESS_SERVICES",
    "ADVERTISING_AND_MARKETING",
    "ARCHITECTURE",
    "COMPANY_ESTABLISHMENT_FORMATION_SERVICES",
    "DESIGN",
    "FINANCIAL_CONSULTING_ACCOUNTING_TAXATION_AUDITING",
    "IT_DEVELOPMENT",
    "IT_HOSTING_SERVICES",
    "IT_CONSULTING_AND_SERVICES",
    "LEGAL_SERVICES",
    "MANAGEMENT_CONSULTING",
    "SCIENTIFIC_AND_TECHNICAL_CONSULTING",
    "SOFTWARE_AS_A_SERVICE",
    "TRANSLATION_AND_LANGUAGE_SERVICES",
    "CONSULTING_OTHER",
    "SERVICES_OTHER",
    "FREELANCE_PLATFORMS",
    "RECRUITMENT_SERVICES",
    "MAINTENANCE_SERVICES"
  ],
  "MEDIA_AND_ENTERTAINMENT": [
    "DESIGN_MARKETING_COMMUNICATIONS",
    "AUDIO_AND_VIDEO",
    "PHOTOGRAPHY",
    "PRINT_AND_ONLINE_MEDIA",
    "TELECOMMUNICATIONS_SERVICES",
    "MEDIA_COMMUNICATION_ENTERTAINMENT",
    "ADULT_CONTENT",
    "FINE_ARTS",
    "ARTS_OTHER",
    "EVENTS_AND_ENTERTAINMENT",
    "GAMBLING_BETTING_AND_ONLINE_GAMING",
    "NEWSPAPERS_MAGAZINES_AND_BOOKS",
    "PERFORMING_ARTS",
    "VIDEO_GAMING"
  ],
  "EDUCATION": [
    "EDUCATION_LEARNING",
    "SCHOOLS_AND_UNIVERSITIES",
    "TEACHING_AND_TUTORING",
    "ONLINE_LEARNING"
  ],
  "FINANCIAL_SERVICES": [
    "FINANCIAL_SERVICES_PRODUCTS_HOLDING_COMPANIES",
    "CROWDFUNDING",
    "CRYPTOCURRENCY_FINANCIAL_SERVICES",
    "HOLDING_COMPANIES",
    "INSURANCE",
    "INVESTMENTS",
    "MONEY_SERVICE_BUSINESSES",
    "FINANCIAL_SERVICES_OTHER"
  ],
  "FOOD_AND_BEVERAGES": [
    "FOOD_BEVERAGES_TOBACCO",
    "ALCOHOL",
    "FOOD_MANUFACTURING_RETAIL",
    "RESTAURANTS_AND_CATERING",
    "SOFT_DRINKS",
    "TOBACCO",
    "VITAMINS_AND_DIETARY_SUPPLEMENTS"
  ],
  "HEALTH_AND_MEDICAL": [
    "HEALTH_PHARMACEUTICALS_PERSONAL_CARE",
    "HEALTH_AND_BEAUTY_PRODUCTS_AND_SERVICES",
    "DENTAL_SERVICES",
    "DOCTORS_AND_MEDICAL_SERVICES",
    "ELDERLY_OR_OTHER_CARE_HOME",
    "FITNESS_SPORTS_SERVICES",
    "MEDICAL_EQUIPMENT",
    "NURSING_AND_OTHER_CARE_SERVICES",
    "PHARMACEUTICALS",
    "PHARMACY"
  ],
  "PUBLIC_SERVICES": [
    "PUBLIC_GOVERNMENT_SERVICES",
    "PUBLIC_ALL_SERVICES",
    "GOVERNMENT_SERVICES",
    "UTILITY_SERVICES"
  ],
  "REAL_ESTATE": [
    "REAL_ESTATE_CONSTRUCTION",
    "REAL_ESTATE_DEVELOPMENT",
    "REAL_ESTATE_SALE_PURCHASE_AND_MANAGEMENT"
  ],
  "RETAIL_AND_MANUFACTURING": [
    "RETAIL_WHOLESALE_MANUFACTURING",
    "AGRICULTURE_SEEDS_PLANTS",
    "AUTOMOTIVE_SALES_SPARE_PARTS_TRADE",
    "AUTOMOTIVE_MANUFACTURING",
    "CHEMICALS",
    "CLOTHING",
    "ELECTRICAL_PRODUCTS",
    "FIREARMS_WEAPONS_AND_MILITARY_GOODS_SERVICES",
    "HOME_ACCESSORIES_FURNITURE",
    "FINE_JEWELLERY_WATCHES",
    "FASHION_JEWELLERY",
    "LEGAL_HIGHS_AND_RELATED_ACCESSORIES",
    "MACHINERY",
    "PETS",
    "PRECIOUS_STONES_DIAMONDS_AND_METALS",
    "SPORTING_EQUIPMENT",
    "MANUFACTURING_OTHER",
    "RETAIL_WHOLESALE_MARKETPLACE_AUCTION",
    "RETAIL_WHOLESALE_OTHER",
    "TOYS_AND_GAMES"
  ],
  TRAVEL_AND_TRANSPORT: [
    "TRAVEL_TRANSPORT_TOUR_AGENCIES",
    "ACCOMMODATION_HOTELS",
    "PASSENGER_TRANSPORT",
    "FREIGHT_TRANSPORT",
    "RIDESHARING_TRANSPORT_SHARING_SERVICES",
    "TRANSPORT",
    "TRAVEL_AGENCIES",
    "TOUR_OPERATORS",
    "TRAVEL_OR_TOUR_ACTIVITIES_OTHER"
  ],
  OTHER: ["OTHER", "OTHER_NOT_LISTED_ABOVE"]
}; 

// Takes `WISE_BUSINESS_CATEGORIES` and creates a validator using Zod.
// 1. First the input takes the `WISE_BUSINESS_CATEGORIES` object which contains a strucutred list of bussiness categories and their subcategories. Using Object.keys(), it pulls out the top level categories.  
// 2. The output is a Zod Enum volidator that will only accept one of the top level categories.
// 3. The logic works by first getting all the top level keys form the bussiness categories object, then creating a type-safe enum from that list. The `z.enum()` functions. 
// 4. The `as [string, ...string[]]` is a type assertion that tells TypeScript that the output is an array of strings.
// 5. The main data transformation is done when converting an objects keys into a list of allowed values for the enum. 

const firstLevelCategoryEnum = z.enum(Object.keys(WISE_BUSINESS_CATEGORIES) as [string, ...string[]]);

// 🔥 Function to Get Valid Second Level Categories
/**
 * Retrieves the valid second-level business categories for the given first-level category.
 *
 * @param firstLevel - The first-level business category.
 * @returns An array of second-level business categories, or an empty array if the first-level category is not found.
 */
const getSecondLevelCategories = (firstLevel: FirstLevelCategory): string[] => {
  return firstLevel in WISE_BUSINESS_CATEGORIES ? WISE_BUSINESS_CATEGORIES[firstLevel] : [];
};

export const wiseRouter = createTRPCRouter({
  createPersonalProfile: publicProcedure
    .input(z.object({
      firstName: z.string().max(30),
      lastName: z.string().max(30),
      preferredName: z.string().max(30).optional(),
      nationality: z.string().length(3).toLowerCase(),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      externalCustomerId: z.string().optional(),
      address: z.object({
        addressFirstLine: z.string(),
        city: z.string(),
        countryIso3Code: z.string().length(3).toLowerCase(),
        postCode: z.string(),
        stateCode: z.string().max(5).optional()
          .superRefine((stateCode, ctx) => {
            // Get the parent object (address) to access countryIso3Code
            const address = ctx.path[ctx.path.length - 2] as { countryIso3Code?: string };
            const countryRequiresState = ['usa', 'can', 'bra', 'aus'];
            if (address?.countryIso3Code &&
              countryRequiresState.includes(address.countryIso3Code.toLowerCase()) &&
              !stateCode) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `State code is required for ${address.countryIso3Code.toUpperCase()}`,
                path: ['stateCode']
              });
            }
          }),
      }),
      contactDetails: z.object({
        email: z.string().email(),
        phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format"),
      }),
      occupations: z.array(z.object({
        code: z.string(),
        format: z.literal("FREE_FORM")
      })).optional(),
      details: z.object({
        firstNameInKana: z.string(),
        lastNameInKana: z.string(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const response = await axios.post("https://api.wise.com/v1/profiles", {
        firstName: input.firstName,
        lastName: input.lastName,
        preferredName: input.preferredName,
        nationality: input.nationality,
        dateOfBirth: input.dateOfBirth,
        externalCustomerId: input.externalCustomerId,
        address: input.address,
        contactDetails: input.contactDetails,
        occupations: input.occupations,
        ...(input.nationality === "jpn" && input.details && {
          details: {
            firstNameInKana: input.details.firstNameInKana,
            lastNameInKana: input.details.lastNameInKana,
          },
        }),
      }, {
        headers: {
          Authorization: `Bearer ${env.WISE_CLIENT_SECRET}`,
        },
      });
      return response.data;
    }),

  createBusinessProfile: publicProcedure
    .input(z.object({
      businessName: z.string(),
      businessNameInKatakana: z.string().optional(),
      businessFreeFormDescription: z.string(),
      registrationNumber: z.string(),
      acn: z.string().optional(),
      abn: z.string().optional(),
      arbn: z.string().optional(),
      companyType: z.enum(['LIMITED_PARTNERSHIP', 'SOLE_TRADER', 'LIMITED_BY_GUARANTEE', 'LIMITED_LIABILITY_COMPANY', 'FOR_PROFIT_CORPORATION', 'NON_PROFIT_CORPORATION', 'LIMITED_LIABILITY_PARTNERSHIP', 'GENERAL_PARTNERSHIP', 'SOLE_PROPRIETORSHIP', 'PRIVATE_LIMITED_COMPANY', 'PUBLIC_LIMITED_COMPANY', 'TRUST', 'OTHER']),
      companyRole: z.enum(['OWNER', 'DIRECTOR', 'OTHER']),
      address: z.object({
        addressFirstLine: z.string(),
        city: z.string(),
        countryIso2Code: z.string().length(2),
        countryIso3Code: z.string().length(3).toLowerCase(),
        postCode: z.string(),
        stateCode: z.string().max(5).optional()
          .superRefine((stateCode, ctx) => {
            const address = ctx.path[ctx.path.length - 2] as { countryIso3Code?: string };
            const countryRequiresState = ['usa', 'can', 'bra', 'aus'];
            if (address?.countryIso3Code &&
              countryRequiresState.includes(address.countryIso3Code.toLowerCase()) &&
              !stateCode) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `State code is required for ${address.countryIso3Code.toUpperCase()}`,
                path: ['stateCode']
              });
            }
          }),
      }),
      externalCustomerId: z.string(),
      actorEmail: z.string().email(),
      firstLevelCategory: firstLevelCategoryEnum,
      /**
       * Validates the secondLevelCategory based on the selected firstLevelCategory.
       * Ensures that the provided secondLevelCategory is one of the valid categories
       * for the corresponding firstLevelCategory using the getSecondLevelCategories function.
       * Adds a custom Zod validation error if the category is invalid.
       */
      secondLevelCategory: z.string().superRefine((value, ctx) => {
        // Get the parent object that contains firstLevelCategory
        const parent = ctx.path[0] as { firstLevelCategory?: FirstLevelCategory };
        
        if (parent && parent.firstLevelCategory) {
          const validSecondLevels = getSecondLevelCategories(parent.firstLevelCategory);
          
          // Convert the readonly tuple to a regular array for includes check
          
          // or use type assertion to tell TypeScript this is okay
          if (!validSecondLevels.includes(value as any)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Invalid secondLevelCategory. Allowed values for ${parent.firstLevelCategory}: ${validSecondLevels.join(", ")}`,
            });
          }
        }
      }),   
        operationalAddresses: z.array(z.object({
        addressFirstLine: z.string(),
        city: z.string(),
        countryIso2Code: z.string().length(2),
        countryIso3Code: z.string().length(3).toLowerCase(),
        postCode: z.string(),
        stateCode: z.string().optional(),
      })),
      webpage: z.string().url()
        .superRefine((webpage, ctx) => {
          const parent = ctx.path[0] as { companyType?: string };
          if (parent?.companyType === 'OTHER' && !webpage) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Webpage is required when company type is OTHER',
            });
          }
        })
    }))
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
            Authorization: `Bearer ${env.WISE_CLIENT_SECRET}`,
            "Content-Type": "application/json",
           "Accept-Minor-Version": "1",
          },
        }
      );
      return response.data;
    }),

    // After Creating the Profiles for the Bussiness we can store the profile id in the database along with other data we need for future use.
    // On the UI side this will be determine the UI and forms the sender will be asked to fill out once scan the code.

    // This will get the requirements for the recipient based on the country the senders bank origins
    // This is because each countries bank has it's own protocal and systems to interface with.
    // We will have to grab the target from the database and the user will have to select there banks currency which will the source
    // getRecipientRequirements: publicProcedure
    // .input(z.object({
    //   sourceCurrency: currencyEnum,
    //   targetCurrency: currencyEnum,
    //   sourceAmount: z.number(),
    // }))
    // .mutation(async ({ input }) => {
    //   const { data } = await axios.post(
    //     "https://api.wise.com/v1/requirements",
    //     {
    //       sourceCurrency: input.sourceCurrency,
    //       targetCurrency: input.targetCurrency,
    //       sourceAmount: input.sourceAmount,
    //     },
    //     {
    //       headers: {
    //         Authorization: `Bearer ${env.WISE_CLIENT}`,
    //         "Content-Type": "application/json",
    //         "Accept-Minor-Version": "1",
    //       },
    //     }
    //   );
    //   return data;
    // }),

    // createRecipient: publicProcedure
    // .input(z.object({
    //   accountHolderName: z.string(),
    //   currency: currencyEnum,
    //   details: z.object({
    //     accountNumber: z.string(),
    //     routingNumber: z.string(),
    //   })
    // }))
    // .mutation(async ({ input }) => {
    //   const { data: profile } = await axios.get("https://api.wise./v1/profiles", {
    //     headers: { Authorization: `Bearer ${env.WISE_CLIENT}` },
    //   });
    //   const profileId = profile.find((p: { type: string; }) => p.type === "business")?.id || profile[0].id;

    //   const { data } = await axios.post(
    //     "https://api.wise.com/v1/recipients",
    //     {
    //       profile: profileId,
    //       accountHolderName: input.accountHolderName,
    //       currency: input.currency,
    //       type: "aba",
    //       details: input.details,
    //     },
    //     {
    //       headers: {
    //         Authorization: `Bearer ${env.WISE_CLIENT_SECRET}`
    //       },
    //     }
    //   );
    //   return data;
    // }),

  // throw new Error(`No requirement for type ${input.type}`);
  
createRecipient: publicProcedure
  .input(z.object({
      accountHolderName: z.string(),
      sourceCurrency: currencyEnum,
      targetCurrency: currencyEnum,
      sourceAmount: z.number(),
      type: z.string(),
    }))
    .mutation(async ({ input }) => {

      // Step 1: Get Requiements for recipients based on source and target currency
      const response: WiseRequirementsResponse = await axios.get("https://api.wise.com/v1/account-requirements", {
        params: {
          source: "EUR",
          target: "USD",
          sourceAmount: 1000,
        },
        headers: {
          // Authorization: `Bearer ${env.WISE_API_KEY}`,
          "Content-Type": "application/json",
          "Accept-Minor-Version": "1",
        },
      });

      // Step 2: Validate & Extract Required Field
      // The requirements object needs to contains a list of types obtained from the response of the wise v1/requirements which will be used to geneate a requirements schema dynamically. 
      // The type of the recipient is obtained from the input.type which is not corrected it needs to be obtained from the response object
      // const requirements = data.find((r: any) => r.type === input.type);

      // Step 3: Generate Zod schema dynamically
      const dynamicSchema = dynamicRecipentSchema(response);
      // const dynamicSchema = dynamicRecipentSchema(requirements, data);

      // Step 4: Validate frontend form input against schema. This input currently represents a placeholder
      const result = dynamicSchema.safeParse(input);
      if (!result.success) {
        throw new Error(`Invalid input: ${result.error.message}`);
      } else {
        console.log("Validated Input:", result.data);
      }

      const validatedDetails = result.data;

      // Step 4 Alternative with DB intergration: Retrieve stored user input from DB after testing requests
      
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
      const { data: profiles } = await axios.get("https://api.wise.com/v1/profiles", {
        headers: {
            Authorization: `Bearer ${env.WISE_CLIENT}`,
            "Content-Type": "application/json",
            "Accept-Minor-Version": "1",
        },
      });

      const profileId = profiles.find((p: any) => p.type === "business")?.id || profiles[0].id;

      // Step 7: Create the recipent
      const { data: recipient } = await axios.post(
        "https://api.wise.com/v1/recipients",
      {
        profile: profileId,
        accountHolderName: validatedDetails.accountHolderName,
        currency: input.targetCurrency,
        type: input.type,
        details: validatedDetails 
      },
      {
        headers: {
             Authorization: `Bearer ${env.WISE_CLIENT}`,
            "Content-Type": "application/json",
            "Accept-Minor-Version": "1",
        }
      }
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
  })
  
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