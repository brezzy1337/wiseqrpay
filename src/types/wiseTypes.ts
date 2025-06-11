import { z } from "zod";

export const WISE_CURRENCIES = [
  "AED", "AUD", "BGN", "BRL", "CAD", "CHF", "CLP", "CZK", "DKK", "EUR", "GBP",
  "HKD", "HRK", "HUF", "IDR", "ILS", "INR", "JPY", "KRW", "MXN", "MYR", "NOK",
  "NZD", "PHP", "PLN", "RON", "SEK", "SGD", "THB", "TRY", "USD", "ZAR"
] as const;

export const currencyEnum = z.enum(WISE_CURRENCIES);

export const WISE_BUSINESS_CATEGORIES = {
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

// Define the type for first level categories
export type FirstLevelCategory = keyof typeof WISE_BUSINESS_CATEGORIES;

// Define the type for second level categories (union of all possible values)
export type SecondLevelCategory = typeof WISE_BUSINESS_CATEGORIES[FirstLevelCategory][number];

// Create a type-safe validator for second level categories based on the first level category.
export const createSecondLevelCategoryValidator = (firstLevel: FirstLevelCategory) => {
  const validCategories = WISE_BUSINESS_CATEGORIES[firstLevel];
  return z.enum(validCategories as [string, ...string[]]);
}

// First level category enum
export const firstLevelCategoryEnum = z.enum(Object.keys(WISE_BUSINESS_CATEGORIES) as [string, ...string[]]);

/**
 * Retrieves the valid second-level business categories for the given first-level category.
 *
 * @param firstLevel - The first-level business category.
 * @returns An array of second-level business categories, or an empty array if the first-level category is not found.
 */
export const getSecondLevelCategories = (firstLevel: FirstLevelCategory): string[] => {
  return firstLevel in WISE_BUSINESS_CATEGORIES ? WISE_BUSINESS_CATEGORIES[firstLevel] : [];
};

// Schema for personal profile
export const personalProfileSchema = z.object({
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
});

// Schema for business profile
export const businessProfileSchema = z.object({
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
  secondLevelCategory: z.string().superRefine((value, ctx) => {
    // Get the parent object that contains firstLevelCategory
    const parent = ctx.path[0] as { firstLevelCategory?: FirstLevelCategory };
    
    if (parent && parent.firstLevelCategory) {
      const validSecondLevels = getSecondLevelCategories(parent.firstLevelCategory);
      
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
});

// Schema for recipient
export const recipientSchema = z.object({
  accountHolderName: z.string(),
  currency: currencyEnum,
  details: z.object({
    accountNumber: z.string(),
    routingNumber: z.string(),
  })
});

// Schema for transfer
export const transferSchema = z.object({
  userId: z.string(),
  recipientId: z.string(),
  amount: z.number(),
  currency: currencyEnum,
});

// Schema for payment query
export const paymentQuerySchema = z.object({
  paymentId: z.string(),
});