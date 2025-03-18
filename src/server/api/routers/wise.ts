import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import axios from "axios";
import QRCode from "qrcode";
import { env } from "~/env";
import { prisma } from "~/server/api/db";

const WISE_CURRENCIES = [
  "AED", "AUD", "BGN", "BRL", "CAD", "CHF", "CLP", "CZK", "DKK", "EUR", "GBP",
  "HKD", "HRK", "HUF", "IDR", "ILS", "INR", "JPY", "KRW", "MXN", "MYR", "NOK",
  "NZD", "PHP", "PLN", "RON", "SEK", "SGD", "THB", "TRY", "USD", "ZAR"
] as const;

const currencyEnum = z.enum(WISE_CURRENCIES);

// Define the type for first level categories
type FirstLevelCategory = keyof typeof WISE_BUSINESS_CATEGORIES;

// Define the type for second level categories (union of all possible values)
type SecondLevelCategory = typeof WISE_BUSINESS_CATEGORIES[FirstLevelCategory][number];


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
} as const;

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
const getSecondLevelCategories = (firstLevel: FirstLevelCategory): readonly string[] => {
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
        const firstLevel = ctx.path[ctx.path.length - 2] as { firstLevelCategory?: keyof typeof firstLevelCategoryEnum };
        const validSecondLevels = getSecondLevelCategories(firstLevel?.firstLevelCategory as keyof typeof firstLevelCategoryEnum);
        if (!validSecondLevels.includes(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid secondLevelCategory. Allowed values for ${firstLevel?.firstLevelCategory}: ${validSecondLevels.join(", ")}`,
          });
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
          },
        }
      );
      return response.data;
    }),
    
    createRecipient: publicProcedure
    .input(z.object({
      accountHolderName: z.string(),
      currency: currencyEnum,
      details: z.object({
        accountNumber: z.string(),
        routingNumber: z.string(),
      })
    }))
    .mutation(async ({ input }) => {

      const { data: profile } = await axios.get("https://api.wise./v1/profiles", {
        headers: { Authorization: `Bearer ${env.WISE_CLIENT}` },
      });
      const profileId = profile.find((p: { type: string; }) => p.type === "business")?.id || profile[0].id;

      const { data } = await axios.post(
        "https://api.wise.com/v1/recipients",
        {
          profile: profileId,
          accountHolderName: input.accountHolderName,
          currency: input.currency,
          type: "aba",
          details: input.details,
        },
        {
          headers: {
            Authorization: `Bearer ${env.WISE_CLIENT_SECRET}`
          },
        }
      );
      return data;
    }),

  createTransfer: publicProcedure
    .input(z.object({
      userId: z.string(),
      recipientId: z.string(),
      amount: z.number(),
      currency: currencyEnum,
    }))
    .mutation(async ({ input }) => {
      // Create transfer in Wise
      const { data: transferData } = await axios.post(
        "https://api.wise.com/v1/transfers",
        {
          targetAccount: input.recipientId,
          source: input.currency,
          target: input.currency,
          sourceAmount: input.amount || undefined,
          customerTransactionId: `txn_${Date.now()}`,
        },
        {
          headers: {
            "Authorization": `Bearer ${env.WISE_CLIENT_SECRET}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Generate QR code
      const qrCode = await QRCode.toDataURL(transferData.payInUrl);

      // Store payment in database
      const payment = await prisma.payment.create({
        data: {
          userId: input.userId,
          recipientId: input.recipientId,
          transferId: transferData.id,
          paymentUrl: transferData.payInUrl,
          qrCode: qrCode,
          amount: input.amount,

          currency: input.currency,
                  },
      });

      return {
        ...payment,
        qrCode,
      };
    }),
    
  getPayment: publicProcedure
    .input(z.object({
      paymentId: z.string(),
    }))
    .query(async ({ input }) => {
      return prisma.payment.findUnique({
        where: {
          id: input.paymentId,
        },
      });
    }),
});
