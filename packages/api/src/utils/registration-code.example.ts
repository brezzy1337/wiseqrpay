/**
 * Example usage of the registration code utilities
 *
 * This file demonstrates the secure registration flow using registration codes.
 * Registration codes are treated with the same security standards as passwords.
 */

import { randomBytes } from "crypto";

import {
  generateAndHashRegistrationCode,
  generateRegistrationCode,
  hashRegistrationCode,
  verifyRegistrationCode,
} from "./registration-code";

// ============================================================================
// Example 1: Basic usage - Generate and hash a registration code
// ============================================================================
export function example1_generateRegistrationCode() {
  // Generate a secure registration code and its hash
  const { code, hashedCode } = generateAndHashRegistrationCode();

  console.log("Plain code (send to user/store in cookie):", code);
  console.log("Hashed code (store in database):", hashedCode);

  // The plain code should be:
  // - Stored in a secure, HttpOnly, SameSite cookie
  // - Never logged in production
  // - Never sent in response body (only in cookie)

  // The hashed code should be:
  // - Stored in the database
  // - Used for verification when user completes registration
}

// ============================================================================
// Example 2: Complete registration flow
// ============================================================================
export async function example2_completeRegistrationFlow(
  email: string,
  // db: any, // Your database client
) {
  // Step 1: User initiates registration
  // Generate registration code
  const { code, hashedCode } = generateAndHashRegistrationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Step 2: Store hashed code in database
  const registrationId = randomBytes(16).toString("hex");

  // Example DB insert (adjust to your DB client):
  // await db.insert(registrationCode).values({
  //   id: registrationId,
  //   email: email,
  //   hashedCode: hashedCode,
  //   expiresAt: expiresAt,
  //   used: false,
  // });

  // Step 3: Return the plain code in a secure cookie
  // (This happens in your tRPC context or API handler)
  // ctx.setCookie("__Host-regCode", code, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "lax",
  //   path: "/",
  //   maxAge: 60 * 15, // 15 minutes
  // });

  return {
    registrationId,
    expiresAt,
  };
}

// ============================================================================
// Example 3: Verify registration code when user completes registration
// ============================================================================
export async function example3_verifyRegistrationCode(
  providedCode: string,
  // db: any, // Your database client
  email: string,
) {
  // Step 1: Retrieve hashed code from database
  // const dbRecord = await db
  //   .select()
  //   .from(registrationCode)
  //   .where(
  //     and(
  //       eq(registrationCode.email, email),
  //       eq(registrationCode.used, false),
  //       gt(registrationCode.expiresAt, new Date()),
  //     )
  //   )
  //   .limit(1);

  // For this example, simulate a stored hash
  const storedHashedCode = hashRegistrationCode(providedCode); // In reality, get from DB

  // Step 2: Verify the code using timing-safe comparison
  const isValid = verifyRegistrationCode(providedCode, storedHashedCode);

  if (!isValid) {
    throw new Error("Invalid registration code");
  }

  // Step 3: Mark code as used to prevent reuse
  // await db
  //   .update(registrationCode)
  //   .set({ used: true })
  //   .where(eq(registrationCode.email, email));

  // Step 4: Complete user registration
  console.log("Registration code verified successfully!");
  return { success: true };
}

// ============================================================================
// Example 4: Individual function usage
// ============================================================================
export function example4_individualFunctions() {
  // Generate only the code
  const code = generateRegistrationCode(); // 64 hex characters (32 bytes)
  console.log("Generated code:", code);

  // Hash a code
  const hashedCode = hashRegistrationCode(code);
  console.log("Hashed code:", hashedCode);

  // Verify a code
  const isValid = verifyRegistrationCode(code, hashedCode);
  console.log("Code is valid:", isValid);

  // Try with wrong code
  const wrongCode = generateRegistrationCode();
  const isWrongValid = verifyRegistrationCode(wrongCode, hashedCode);
  console.log("Wrong code is valid:", isWrongValid); // false
}

// ============================================================================
// Security Notes
// ============================================================================
/*
 * IMPORTANT SECURITY CONSIDERATIONS:
 *
 * 1. NEVER store registration codes in plain text
 * 2. NEVER return registration codes in API response bodies
 * 3. ALWAYS use secure, HttpOnly cookies for storing codes client-side
 * 4. ALWAYS set expiration times (recommend 15 minutes max)
 * 5. ALWAYS mark codes as "used" after successful registration
 * 6. Use timing-safe comparison to prevent timing attacks
 * 7. Consider rate limiting registration code generation
 * 8. Log suspicious activities (multiple failed attempts)
 * 9. Clean up expired codes regularly
 * 10. Use HTTPS in production (required for __Host- prefix)
 *
 * The __Host- cookie prefix ensures:
 * - Cookie is set with Secure flag
 * - Cookie is not set from a subdomain
 * - Cookie path is set to "/"
 */
