import { test, describe, expect } from "vitest";
import axios from "axios";
import { env } from "~/env";
import { dynamicRecipentSchema } from "../../../types/schema/dynamicRecipientSchema"
import { generateMockInputFromSchema } from "../utils/generateMockInput";

// const WISE_API_KEY = process.env.WISE_API_KEY!;

describe("Live Wise schema pull test (only run locally)", () => {
  test("Should build a Zod schema from real Wise requirements (ABA)", async () => {
    const response = await axios.get("https://api.wise.com/v1/account-requirements", {
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

    const schema = dynamicRecipentSchema(response.data);

    const result = schema.safeParse({
      legalType: "PRIVATE",
      accountHolderName: "John Doe",
      abartn: "123456789",
      accountNumber: "12345678",
      accountType: "CHECKING",
      "address.country": "US",
      "address.city": "New York",
      "address.firstLine": "123 Test St",
      "address.postCode": "10001",
    });

    const dynamicResults = schema.safeParse({ generateMockInputFromSchema })

    expect(result.success).toBe(true);
    expect(dynamicResults.success).toBe(true);
  });
});
