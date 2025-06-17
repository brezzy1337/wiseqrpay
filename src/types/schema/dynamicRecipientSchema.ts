import { z, ZodObject } from "zod";

export type WiseFieldGroup = {
    key: string;
    name: string;
    required: boolean;
    minLength?: number | null;
    maxLength?: number | null;
    validationRegexp?: string | null;
    valuesAllowed?: { key: string }[] | null;
};

export type WiseRequirement = {
    type: string;
    title: string;
    fields: { 
        group: WiseFieldGroup[];
    }[];
};

export type WiseRequirementsResponse = {
    requirements: WiseRequirement[];
};

// So for this function it look like it just group one requriment type, to create a proper Zod schema I need a object or array of requirments. 

/**
 * @param requirements The full response array from the /v1/requirements endpoint
 * @param type The specific recipient type you want to build a schema for (e.g. "aba", "swift_code")
 * @returns ZodObject schema for that recipient type * 
 */

/**
 * Creates a Zod schema from Wise API requirements
 * @param requirements The full response array from the /v1/requirements endpoint
 * @returns ZodObject schema for the recipient type
 */
export function dynamicRecipentSchema(requirements: WiseRequirementsResponse): ZodObject<any> {

    console.log(requirements.requirements);

    if (!requirements || !requirements.requirements) {
    throw new Error("No requirements found");
  }

    // Console.dir confirms that the requirements are being passed in correctly.
    // console.dir(requirements, { depth: null });

    // if (!requirements.requirements || requirements.requirements.length === 0) {
    //     throw new Error("No requirements found");
    
    // }
    // const requirement = requirements.requirements.find(r => r.type === type);
    const requirement = requirements.requirements[0]!;
    
    const shape: Record<string, any> = {};
    
    // Loop through each field in the requirement and then into each group in those fields
    // TODO: Make sure that each group has it's required values accounted for.
    // TODO: So far it looks like we just have Regex, minLength, maxLength, and allowedValues but there are many more types of validation that other groups needs.
    // TODO: Test this schema against all currency combinations.
    for (const fields of requirement.fields) {
        for (const group of fields.group) {
            let validator: any;

            if (!group.required) {
                // The optional() function is throwing a error because it is not typed in typescript. 
                // Not sure if this error is still relavent
                validator = z.optional(z.string());
            }
            
            // If there are allowed values, use an enum
            if (group.valuesAllowed && Array.isArray(group.valuesAllowed)) {
                const values = group.valuesAllowed.map(v => v.key);
                if (values.length > 0) {
                    validator = z.enum(values as [string, ...string[]]);
                } else {
                    validator = z.string(); // fallback if enum is empty
                }
            } else {
                validator = z.string({
                    required_error: `${group.key} is required`,
                    invalid_type_error: `${group.key} must be a string`,
                });

                // Regex
                // If there is a regex, add it to the validator
                if (group.validationRegexp) {
                    try {
                        const regex = new RegExp(group.validationRegexp);
                        validator = validator.regex(regex, {
                            message: `${group.key} does not match expected format.`,
                        });
                    } catch (err) {
                        console.warn(`⚠️ Invalid regex ignored for ${group.key}`);
                    }
                }

                // Length
                // If there is a min or max length, add it to the validator
                // TODO: Add a check to make sure that the min and max lengths are not the same.
                // TODO: Make sure this works.
                if (group.minLength != null) {
                    validator = validator.min(group.minLength, {
                        message: `${group.key} must be at least ${group.minLength} characters`,
                    });
                }
                if (group.maxLength != null) {
                    validator = validator.max(group.maxLength, {
                        message: `${group.key} must be at most ${group.maxLength} characters`,
                    });
                }
            }
            shape[group.key] = validator;
        }
    }

    const zodSchema = z.object(shape);
    
    // Convert to JSON Schema using Zod 4's native conversion
    const jsonSchema = z.toJSONSchema(zodSchema, {
        target: "draft-2020-12", // Use latest JSON Schema version
        unrepresentable: "any", // Handle any unrepresentable types gracefully
    });
    
    return {
        zodSchema,
        jsonSchema
    };
}

/**
 * Creates a JSON Schema directly from Wise API requirements
 * @param requirements The full response array from the /v1/requirements endpoint
 * @returns JSON Schema object
 */
export function dynamicRecipientJsonSchema(requirements: WiseRequirementsResponse): any {
    const { jsonSchema } = dynamicRecipentSchema(requirements);
    return jsonSchema;
}

/**
 * Creates only the Zod schema from Wise API requirements (backward compatibility)
 * @param requirements The full response array from the /v1/requirements endpoint
 * @returns ZodObject schema for the recipient type
 */
export function dynamicRecipientZodSchema(requirements: WiseRequirementsResponse): ZodObject<any> {
    const { zodSchema } = dynamicRecipentSchema(requirements);
    return zodSchema;
}
