import {
  ZodObject,
  ZodEnum,
  ZodOptional,
  ZodEffects,
  ZodString,
  ZodTypeAny,
} from "zod";
import { faker } from "@faker-js/faker";

type Opts = { includeOptional?: boolean };

type RegExpMatchArray = [string] & string[] & {
    index?: number;
    input?: string;
}

export function generateMockInputFromSchema(
  schema: ZodObject<any>,
  { includeOptional = false }: Opts = {}
): Record<string, any> {
  const mock: Record<string, any> = {};

  for (const [rawKey, rawField] of Object.entries(schema.shape)) {

    let field = rawField as ZodTypeAny;

    // ── unwrap optional / superRefine layers ──────────────────────────
    while (field instanceof ZodEffects) field = field._def.schema;
    if (field instanceof ZodOptional) {
      if (!includeOptional) continue;
      field = field.unwrap();
    }

    const k = rawKey.toLowerCase();

    // ── ENUMS ─────────────────────────────────────────────────────────
    if (field instanceof ZodEnum) {
      mock[rawKey] = field._def.values[0];
      continue;
    }

    // ── STRINGS ───────────────────────────────────────────────────────
    if (field instanceof ZodString) {
      const { checks } = field._def;
      const regex = checks.find(c => c.kind === "regex")?.regex ?? null;
      const min   = checks.find(c => c.kind === "min")?.value ?? 4;
      const max   = checks.find(c => c.kind === "max")?.value ?? 24;

      // 1️⃣  KEY-FIRST decision
      let value: string;
      if (k.includes("email"))               value = faker.internet.email();
      else if (k.includes("name"))           value = faker.person.fullName();
      else if (k.includes("city"))           value = faker.location.city();
      else if (k.includes("country"))        value = faker.location.countryCode("alpha-2");
      else if (k.includes("postcode") || k.includes("zipcode"))
                                             value = faker.location.zipCode();
      else if (k.includes("address") && k.includes("firstline"))
                                             value = faker.location.streetAddress();
      else if (k.includes("abartn") || k.includes("routing"))
                                             value = faker.string.numeric(9);
      else if (k.includes("account") && k.includes("number"))
                                             value = faker.finance.accountNumber(10);
      else if (k.includes("account") && k.includes("type"))
                                             value = "CHECKING";
      else if (k === "legaltype")            value = "PRIVATE";
      else                                   value = faker.string.alphanumeric({ length: min });

      // 2️⃣  CONSTRAINT-SECOND adjustment
      // if (regex) {
      //   // digit-only – ^\d{n}$  or  ^\d{m,n}$
      //   const digits = regex.source.match(/^\\d\{(\d+)(?:,(\d+))?\}$/);
      //   if (digits) {
      //     const len = digits[1] === digits[2] || !digits[2]
      //       ? parseInt(digits[1]!)
      //       : faker.number.int({ min: +digits[1]!, max: +digits[2] });
      //     value = faker.string.numeric(len);
      //   }
      //   // fallback to `fromRegExp` if short & safe
      //   else if (regex.source.length < 50 && !regex.source.includes("\\d+")) {
      //     try { value = faker.helpers.fromRegExp(regex); } catch {/* keep existing */ }
      //   }
      // }

      // ensure min/max length
      if (value.length < min) value = value.padEnd(min, "a");
      if (value.length > max) value = value.slice(0, max);

      mock[rawKey] = value;
    }
  }
  // Working great for USD to EUR
  // console.log(mock);
  return mock;
}