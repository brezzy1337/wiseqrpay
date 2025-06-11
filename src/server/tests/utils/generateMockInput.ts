import { ZodTypeAny, ZodObject, ZodString, ZodEnum, ZodOptional, ZodEffects } from "zod";

export function generateMockInputFromSchema(schema: ZodObject<any>): Record<string, any> {
  const shape = schema.shape;
  const mockData: Record<string, any> = {};

  for (const key in shape) {
    let field: ZodTypeAny = shape[key];

    // If it's wrapped in ZodEffects (e.g. .refine()), unwrap it
    while (field instanceof ZodEffects) {
      field = field._def.schema;
    }

    // Unwrap ZodOptional
    const isOptional = field.isOptional();
    if (field instanceof ZodOptional) {
      field = field.unwrap();
    }

    if (field instanceof ZodEnum) {
      mockData[key] = field.options[0]; // first allowed value
      continue;
    }

    if (field instanceof ZodString) {
      const constraints = field._def;

      const min = constraints.checks.find(c => c.kind === "min")?.value || 5;
      const max = constraints.checks.find(c => c.kind === "max")?.value || min + 5;

      const regex = constraints.checks.find(c => c.kind === "regex")?.regex;

      // Generate mock string
      let base = "a".repeat(min);
      if (regex) {
        // If regex is an exact digit matcher like ^\d{9}$, produce digits
        if (regex.source.match(/^\\d\{\d+\}$/)) {
          const len = parseInt(regex.source.match(/\d+/)?.[0] || "9");
          base = "1".repeat(len);
        } else if (regex.source.includes("@")) {
          base = "test@example.com"; // assume email
        }
      }

      mockData[key] = base;
    }
  }

  return mockData;
}
