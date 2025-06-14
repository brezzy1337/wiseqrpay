import { ZodTypeAny, ZodObject, ZodString, ZodEnum, ZodOptional, ZodEffects } from "zod";
import { faker } from "@faker-js/faker";

type MockOpts = { includeOptional?: boolean };

export function generateMockInputFromSchema(
  schema: ZodObject<any>,
  { includeOptional = false }: MockOpts = {}
): Record<string, any> {
  const mockData: Record<string, any> = {};

  for (const [key, rawField] of Object.entries(schema.shape)) {
    let field = rawField as ZodTypeAny;
    let isOptional = false;

    // Unwrap effects / optional
    while (field instanceof ZodEffects) field = field._def.schema;
    if (field instanceof ZodOptional) {
      if (!includeOptional) continue;      // skip
      field = field.unwrap();
      isOptional = true;
    }

    if (field instanceof ZodEnum) {
      mockData[key] = field._def.values[0];
      continue;
    }

    if (field instanceof ZodString) {
      const checks = field._def.checks;
      const regexCheck = checks.find(c => c.kind === "regex");
      const min = checks.find(c => c.kind === "min")?.value || 5;
      const max = checks.find(c => c.kind === "max")?.value || 12;

      if (regexCheck) {
        const regex = regexCheck.regex;
        
        // Handle specific regex patterns
        if (regex.source.includes("@")) {
          mockData[key] = faker.internet.email();
        } else if (regex.source === "^\\d{9}$") {
          mockData[key] = faker.string.numeric(9);
        } else if (regex.source === "^\\d{5}$") {
          mockData[key] = faker.string.numeric(5);
        } else if (key.toLowerCase().includes("abartn") || key.toLowerCase().includes("routing")) {
          // ABA routing number is 9 digits
          mockData[key] = faker.string.numeric(9);
        } else if (key.toLowerCase().includes("accountnumber")) {
          // Account numbers are typically 10-12 digits
          mockData[key] = faker.string.numeric(10);
        } else {
          // For other regex patterns, try to generate a simple valid string
          try {
            // For simple patterns, try to use faker's fromRegExp
            if (regex.source.length < 50 && !regex.source.includes("\\d+")) {
              mockData[key] = faker.helpers.fromRegExp(regex);
            } else {
              // For complex patterns, fall back to a simple string
              mockData[key] = faker.string.alphanumeric(min, max);
            }
          } catch (err) {
            mockData[key] = faker.string.alphanumeric(min, max);
          }
        }
      } else {
        // Heuristic faker field inference by key
        if (key.toLowerCase().includes("email")) {
          mockData[key] = faker.internet.email();
        } else if (key.toLowerCase().includes("city")) {
          mockData[key] = faker.location.city();
        } else if (key.toLowerCase().includes("country")) {
          mockData[key] = "US";
        } else if (key.toLowerCase().includes("account") && key.toLowerCase().includes("type")) {
          mockData[key] = "CHECKING";
        } else if (key.toLowerCase().includes("account") && key.toLowerCase().includes("name")) {
          mockData[key] = faker.person.fullName();
        } else if (key.toLowerCase().includes("account")) {
          mockData[key] = faker.finance.accountNumber();
        } else if (key.toLowerCase().includes("postcode") || key.toLowerCase().includes("zipcode")) {
          mockData[key] = faker.location.zipCode();
        } else if (key.toLowerCase().includes("address") && key.toLowerCase().includes("line")) {
          mockData[key] = faker.location.streetAddress();
        } else if (key.toLowerCase() === "legaltype") {
          mockData[key] = "PRIVATE";
        } else {
          mockData[key] = faker.string.alphanumeric(min, max);
        }
      }
    }
  }

  return mockData;
}
