import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * Generate a cryptographically secure registration code.
 *
 * @param length - The length of the code in bytes (default: 32 bytes = 64 hex characters)
 * @returns A secure random registration code as a hex string
 *
 * Security considerations:
 * - Uses crypto.randomBytes for cryptographically secure random generation
 * - Minimum 32 bytes (64 hex characters) to provide sufficient entropy
 * - Should be treated as a secret credential, similar to passwords
 */
export function generateRegistrationCode(length = 32): string {
  if (length < 32) {
    throw new Error("Registration code must be at least 32 bytes for security");
  }

  // Generate cryptographically secure random bytes
  const code = randomBytes(length).toString("hex");
  return code;
}

/**
 * Hash a registration code for secure storage.
 *
 * Uses SHA-256 for hashing. For production systems handling many codes,
 * consider using bcrypt, scrypt, or argon2 for additional security
 * with salt and key stretching.
 *
 * @param code - The registration code to hash
 * @returns The hashed code as a hex string
 *
 * Security considerations:
 * - Never store registration codes in plain text
 * - Always hash before storing in database or cookies
 * - Use timing-safe comparison when validating codes
 */
export function hashRegistrationCode(code: string): string {
  // Use SHA-256 for hashing
  // For production, consider using bcrypt/scrypt/argon2 with salt
  const hash = createHash("sha256").update(code).digest("hex");
  return hash;
}

/**
 * Verify a registration code against a hashed version.
 *
 * @param providedCode - The code to verify
 * @param hashedCode - The hashed code to compare against
 * @returns True if the codes match, false otherwise
 *
 * Security considerations:
 * - Uses timing-safe comparison to prevent timing attacks
 * - Always hash the provided code before comparison
 */
export function verifyRegistrationCode(
  providedCode: string,
  hashedCode: string,
): boolean {
  const providedHash = hashRegistrationCode(providedCode);

  // Convert to buffers for timing-safe comparison
  const providedBuffer = Buffer.from(providedHash, "hex");
  const storedBuffer = Buffer.from(hashedCode, "hex");

  // Ensure buffers are same length to prevent timing attacks
  if (providedBuffer.length !== storedBuffer.length) {
    return false;
  }

  // Use timing-safe comparison
  return timingSafeEqual(providedBuffer, storedBuffer);
}

/**
 * Generate a registration code and return both the plain and hashed versions.
 *
 * @returns An object containing the plain code (to send to user) and hashed code (to store)
 *
 * Usage:
 * ```typescript
 * const { code, hashedCode } = generateAndHashRegistrationCode();
 * // Send 'code' to user (e.g., in cookie or response)
 * // Store 'hashedCode' in database
 * ```
 */
export function generateAndHashRegistrationCode() {
  const code = generateRegistrationCode();
  const hashedCode = hashRegistrationCode(code);

  return {
    code, // Plain version - send to user/store in secure cookie
    hashedCode, // Hashed version - store in database
  };
}
