import type { ZodObject } from "zod/v4";
import { z } from "zod/v4";

export interface WiseFieldGroup {
  key: string;
  name: string;
  required: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  validationRegexp?: string | null;
  valuesAllowed?: { key: string }[] | null;
}

export interface WiseRequirement {
  type: string;
  title: string;
  fields: {
    group: WiseFieldGroup[];
  }[];
}

export type WiseRequirementsResponse = WiseRequirement[];

/**
 * Build a Zod schema dynamically from Wise account requirements.
 * Expects the full response array from `/v1/account-requirements`.
 * Currently uses the first requirement block in the array.
 */

// todo: Build dynamic input schema from this schema.

export function dynamicRecipentSchema(
  requirements: WiseRequirementsResponse,
): ZodObject<any> {
  if (!Array.isArray(requirements) || requirements.length === 0) {
    throw new Error("No requirements found");
  }

  const requirement = requirements[0];
  if (
    !requirement ||
    !Array.isArray(requirement.fields) ||
    requirement.fields.length === 0
  ) {
    throw new Error("No requirement fields found");
  }

  const shape: Record<string, any> = {};

  for (const fields of requirement.fields) {
    for (const group of fields.group) {
      let validator: any;

      // If there are allowed values, prefer an enum
      if (group.valuesAllowed && Array.isArray(group.valuesAllowed)) {
        const values = group.valuesAllowed.map((v) => v.key);
        validator =
          values.length > 0
            ? z.enum(values as [string, ...string[]])
            : z.string();
      } else {
        // Base string
        validator = z.string();

        // Length constraints
        if (group.minLength && Number.isFinite(group.minLength)) {
          validator = validator.min(group.minLength);
        }
        if (group.maxLength && Number.isFinite(group.maxLength)) {
          validator = validator.max(group.maxLength);
        }

        // Regex constraint
        if (group.validationRegexp) {
          try {
            const regex = new RegExp(group.validationRegexp);
            validator = validator.regex(regex, {
              message: `${group.key} does not match expected format`,
            });
          } catch {
            // Ignore invalid regex from remote payload
          }
        }
      }

      // Optional flag
      if (!group.required) {
        validator = validator.optional();
      }

      shape[group.key] = validator;
    }
  }

  return z.object(shape);
}
