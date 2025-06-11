/// <reference types="vitest" />

import { describe, expect, test } from "vitest";
import { dynamicRecipentSchema } from "../../../types/schema/dynamicRecipientSchema";
import { generateMockInputFromSchema } from "../utils/generateMockInput";
import abaRequirements from "../wise/samples/aba.json";

import type { WiseRequirementsResponse } from "../../../types/schema/dynamicRecipientSchema";

describe("Wise dynamic schema generator", () => {
  const requirements: WiseRequirementsResponse = {
    requirements: abaRequirements
  };

  test("should generate a valid Zod schema for ABA", () => {

    // Generates a zod schema based of a sample Response from wise requiremnts
    const schema = dynamicRecipentSchema(requirements);

    // This will represent mock input data which is derived from the requirements response.

    const mockInput = generateMockInputFromSchema(schema);

    // safeParse offer a way to parse data against a schema without throwing an error.
    const result = schema.safeParse({mockInput})
    // const result = schema.safeParse({
    //   legalType: "PRIVATE",
    //   accountHolderName: "John Doe",
    //   abartn: "123456789",
    //   accountNumber: "12345678",
    //   accountType: "CHECKING",
    //   "address.country": "US",
    //   "address.city": "New York",
    //   "address.firstLine": "123 Test St",
    //   "address.postCode": "10001",
    // });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accountNumber).toBe("12345678");
    }
  });

  test("should reject missing required field", () => {
    const schema = dynamicRecipentSchema(requirements);

    const result = schema.safeParse({
      accountHolderName: "John Doe",
      accountType: "CHECKING",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});