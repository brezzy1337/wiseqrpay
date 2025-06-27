import { z, ZodObject } from "zod";
import { logZodSchemaShape } from "../../server/tests/utils/zodSchemaLogger.ts";
import { error } from "console";


// Probably will end up replaceing type structure with Zod schemas.
// Embedded within each schema will be metadata (source, target, amount, etc)
// Phase 2 will be mapping these schemas to a zod registry 
// Which will be iterated over checking for previously validated metadata.

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

export type WiseRequirementsResponse = WiseRequirement[];

// So for this function it look like it just group one requriment type, to create a proper Zod schema I need a object or array of requirments. 

/**
 * @param requirements The full response array from the /v1/requirements endpoint
 * @param type The specific recipient type you want to build a schema for (e.g. "aba", "swift_code")
 * @returns ZodObject schema for that recipient type * 
 */

// Zod recently Released https://zod.dev/json-schema which may be a more effect way to convert the requirements to a Zod schema.
// Regardless it seems like this current method is suffiecnt but potentially less abstracted.

// This function is used to generate a Zod schema dynamically based on the requirements from the Wise API. It takes an array of requirements and a type as input and returns a Zod schema for that type.
export function dynamicRecipentSchema(requirements: WiseRequirementsResponse): ZodObject<any> {
   

    if (requirements === undefined || requirements === undefined || requirements.length === 0) {
        throw new Error("No requirements found");
    }

    console.log("Available types:", requirements.map(r => r.type));


    const requirement = requirements[0];
    
    if(requirement === undefined || requirement.fields === undefined || requirement.fields.length === 0) {
        throw new Error("No requirement found", { cause: `${error}` });
    }

    // Console.dir confirms that the requirements are being passed in correctly.
    console.dir(requirement, { depth: null });

    // if (!requirements.requirements || requirements.requirements.length === 0) {
    //     throw new Error("No requirements found");

    // }
    // const requirement = requirements.requirements.find(r => r.type === type);

    // type Record: https://refine.dev/blog/typescript-record-type/#what-is-record-type-in-typescript
    const shape: Record<string, any> = {};

    // Loop through each field in the requirement and then into each group in those fields
    // TODO: Make sure that each group has it's required values accounted for.
    // TODO: So far it looks like we just have Regex, minLength, maxLength, and allowedValues but there are many more types of validation that other groups needs.

    // Keep Code in the zod ecosystem as much as possible. This could result in a expanded flexilbity while maintaining the type safety of zod.
    // TODO: Test how z.infer could be used
    // TODO: Look into replacing generic types (validator.regex) with zod types (z.regex)
    // TODO: Instead of a Record<Type> we can potentially use z.registy

    // TODO: Test this schema against all currency combinations and store them in a z.registry?

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

                // Zod Regex & Length Validator
                if (group.minLength) {
                    try {
                        validator = validator.min(group.minLength);
                    } catch (error) {
                        console.error(`Error setting min length for ${group.key}:`, error);
                    }
                }
                if (group.maxLength) {
                    try {
                        validator = validator.max(group.maxLength);
                    } catch (error) {
                        console.error(`Error setting max length for ${group.key}:`, error);
                    }
                }
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
                
                // Console and Logger are looking good
                // console.log(validator);
                shape[group.key] = validator;
                // logZodSchemaShape(z.object(shape));
            }
        }
    }
    return z.object(shape);
}