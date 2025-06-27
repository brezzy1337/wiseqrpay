/// <reference types="vitest" />

import { describe, expect, test } from "vitest";
import { dynamicRecipentSchema } from "../../../types/schema/dynamicRecipientSchema.ts";
import { generateMockInputFromSchema } from "../utils/generateMockInput.ts";
// import { logZodSchemaShape } from "../utils/logZodSchemaShape.ts";
import abaRequirements from "../wise/samples/aba.json" with { type: "json" };
import type { WiseRequirementsResponse } from "../../../types/schema/dynamicRecipientSchema.js";

describe("Wise dynamic schema generator", () => {
  const requirements: WiseRequirementsResponse = abaRequirements;

  test("should generate a valid Zod schema for ABA", () => {

    // console.dir(requirements, { depth: null });

    // Generates a zod schema based of a sample Response from wise requiremnts
    const schema = dynamicRecipentSchema(requirements);

    // Log is working great! Just commenting out to clean out testing output 
    //  logZodSchemaShape(schema);

    if (!schema) {
      throw new Error("Schema is undefined");
    }

    // This will represent mock input data which is derived from the requirements response.
    const mockInput = generateMockInputFromSchema(schema);

    // console.dir(mockInput, { depth: null });

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

    // console.dir(result, { depth: null });

    // console.log(result);
    // expect(result.success).toBe(true);
    
  //   if (result.success) {
  //     expect(result.data.accountNumber).toBe("12345678");
  //   }
  // });

  });
});