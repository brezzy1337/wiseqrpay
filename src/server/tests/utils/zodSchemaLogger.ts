import { ZodObject, ZodOptional, ZodEnum, ZodString, ZodTypeAny } from "zod";

export function logZodSchemaShape(schema: ZodObject<any>) {
  console.log("🧩 Zod Schema Shape:\n");

  for (const [key, type] of Object.entries(schema.shape)) {
    let field = type as ZodTypeAny;

    // Using isOptional instead of ZodOptional
    // This is inconsistant with my other Zod oriented code.
    const isOptional = field.isOptional?.() ?? false;
    const fieldType = field.constructor.name;

    console.log(`🔑 ${key}:`);
    console.log(`   - Type: ${fieldType}`);
    if (isOptional) console.log("   - Optional ✅");

    if (field instanceof ZodEnum) {
      console.log(`   - Allowed values: ${field._def.values.join(", ")}`);
      continue;
    }

    if (field instanceof ZodString) {
      const checks = field._def.checks;

      for (const check of checks) {
        if (check.kind === "min") console.log(`   - Min length: ${check.value}`);
        if (check.kind === "max") console.log(`   - Max length: ${check.value}`);
        if (check.kind === "regex") console.log(`   - Regex: ${check.regex}`);
      }
    }

    console.log("");
  }
}