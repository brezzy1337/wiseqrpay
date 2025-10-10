"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verification = exports.registrationCode = exports.verificationToken = exports.account = exports.wiseSession = exports.user = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
// To update schema in TS server you have to rebuild the schema
// Use pnpm --filter @acme/db build
// Prisma: model User
exports.user = (0, pg_core_1.pgTable)("user", function (t) { return ({
    id: t.text(), // Prisma default(cuid()) – generated from Wise API response
    registrationCode: t.text(),
    email: t.text().unique(),
    name: t.text(),
    emailVerified: t.boolean().notNull().default(false),
    isBusiness: t.boolean().notNull().default(false),
    createdAt: t.timestamp().notNull().defaultNow(),
    updatedAt: t.timestamp().notNull().defaultNow(),
}); });
// Wise OAuth token bundle stored server-side
exports.wiseSession = (0, pg_core_1.pgTable)("wise_session", function (t) { return ({
    id: t.text().primaryKey(), // cuid()/uuid set by app
    accessToken: t.text().notNull().unique(),
    refreshToken: t.text().notNull().unique(),
    expires_in: t.integer().notNull(),
    expires_at: t.timestamp().notNull(),
    refresh_expires_at: t.timestamp().notNull(),
    refresh_token_expires_in: t.integer().notNull(),
    scope: t.text(),
    created_at: t.timestamp().notNull(),
    userId: t
        .text()
        .notNull()
        .references(function () { return exports.user.id; }, { onDelete: "cascade" }),
}); }, function (t) { return ({
    accessTokenUnique: (0, pg_core_1.uniqueIndex)("wise_session_access_token_unique").on(t.accessToken),
    userIdIdx: (0, pg_core_1.index)("wise_session_user_id_idx").on(t.userId),
}); });
// Prisma: model Account
exports.account = (0, pg_core_1.pgTable)("account", function (t) { return ({
    id: t.text().primaryKey(), // Prisma default(cuid())
    userId: t
        .text()
        .notNull()
        .references(function () { return exports.user.id; }, { onDelete: "cascade" }),
    type: t.text().notNull(),
    provider: t.text().notNull(),
    providerAccountId: t.text().notNull(),
    refresh_token: t.text(),
    access_token: t.text(),
    expires_at: t.integer(),
    token_type: t.text(),
    scope: t.text(),
    id_token: t.text(),
    session_state: t.text(),
}); }, function (t) { return ({
    providerAndProviderAccountIdUnique: (0, pg_core_1.uniqueIndex)("account_provider_provider_account_id_unique").on(t.provider, t.providerAccountId),
    userIdIdx: (0, pg_core_1.index)("account_user_id_idx").on(t.userId),
}); });
// Prisma: model VerificationToken
exports.verificationToken = (0, pg_core_1.pgTable)("verification_token", function (t) { return ({
    identifier: t.text().notNull(),
    token: t.text().notNull().unique(),
    expires: t.timestamp().notNull(),
}); }, function (t) { return ({
    identifierTokenUnique: (0, pg_core_1.uniqueIndex)("verification_token_identifier_token_unique").on(t.identifier, t.token),
}); });
exports.verification = exports.verificationToken;
// Registration codes for new user sign-ups
// Stores hashed registration codes with same security standards as passwords
exports.registrationCode = (0, pg_core_1.pgTable)("registration_code", function (t) { return ({
    id: t.text(), // unique identifier
    email: t.text().notNull(),
    hashedCode: t.text().notNull(), // SHA-256 hashed registration code
    createdAt: t.timestamp().notNull().defaultNow(),
    expiresAt: t.timestamp().notNull(), // Registration codes should expire (e.g., 15 minutes)
    used: t.boolean().notNull().default(false), // Mark as used to prevent reuse
}); }, function (t) { return ({
    emailIdx: (0, pg_core_1.index)("registration_code_email_idx").on(t.email),
    expiresAtIdx: (0, pg_core_1.index)("registration_code_expires_at_idx").on(t.expiresAt),
}); });
