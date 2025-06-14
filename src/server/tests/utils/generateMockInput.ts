import { ZodTypeAny, ZodObject, ZodString, ZodEnum, ZodOptional, ZodEffects, optional } from "zod";
import { faker } from "@faker-js/faker";

type MockOpts = { includeOptional?: boolean };


//TODO: Report each input added during the process of creating the mock input.


export function generateMockInputFromSchema(
  schema: ZodObject<any>,
  { includeOptional = false }: MockOpts = {}
): Record<string, any> {
  const mockData: Record<string, any> = {};

  for (const [key, rawField] of Object.entries(schema.shape)) {
    let field = rawField as ZodTypeAny;

    // Unwrap effects / optional
    while (field instanceof ZodEffects) field = field._def.schema;
    if (field instanceof ZodOptional) {
      if (!includeOptional) continue;      // skip
      field = field.unwrap();
      optional = true;
    }

    if (field instanceof ZodEnum) {
      mockData[key] = field._def.values[0];
      continue;
    }

    if (field instanceof ZodString) {
      const checks = field._def.checks;
      const regex = checks.find(c => c.kind === "regex")?.regex;
      const min = checks.find(c => c.kind === "min")?.value || 5;
      const max = checks.find(c => c.kind === "max")?.value || 12;

      if (regex) {
        // Try realistic faker types first
        if (regex.source.includes("@")) {
          mockData[key] = faker.internet.email();
        } else if (regex.source.match(/^\\d{9}$/)) {
          mockData[key] = faker.string.numeric(9);
        } else if (regex.source.includes("[A-Z]{3}")) {
          mockData[key] = faker.helpers.fromRegExp(regex);
        } else {
          // fallback to regexify (might be unsafe)
          try {
            mockData[key] = faker.helpers.fromRegExp(regex);
          } catch (err) {
            mockData[key] = faker.string.alphanumeric(min);
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
        } else if (key.toLowerCase().includes("account")) {
          mockData[key] = faker.finance.accountNumber(min);
        } else {
          mockData[key] = faker.string.alphanumeric(min);
        }
      }
    }
  }
  console.log(mockData)

  return mockData;
}