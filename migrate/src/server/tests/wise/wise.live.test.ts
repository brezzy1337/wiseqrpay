import { test, describe, expect } from "vitest";
import axios from "axios";
// import { env } from "~/env";
import { dynamicRecipentSchema, WiseRequirementsResponse } from "../../../types/schema/dynamicRecipientSchema.ts"
import { generateMockInputFromSchema } from "../utils/generateMockInput.ts";
// const WISE_API_KEY = process.env.WISE_API_KEY!;

describe("Live Wise schema pull test (only run locally)", () => {
  test("Should build a Zod schema from real Wise requirements (ABA)", async () => {
    const response = await axios.get<WiseRequirementsResponse>("https://api.wise.com/v1/account-requirements", {
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

  // console.dir(response.data[0], { depth: null });
  
    const schema = dynamicRecipentSchema(response.data);

    const dynamicResults = schema.safeParse({ generateMockInputFromSchema });

    console.log(dynamicResults);

  });
});