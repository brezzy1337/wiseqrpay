import { sql } from "drizzle-orm";
import { index, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";

export const Post = pgTable("post", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  title: t.varchar({ length: 256 }).notNull(),
  content: t.text().notNull(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreatePostSchema = createInsertSchema(Post, {
  title: z.string().max(256),
  content: z.string().max(256),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export * from "./auth-schema";

// Prisma Payment model converted to Drizzle
export const Payment = pgTable(
  "payment",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    userId: t
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientId: t.text().notNull(),
    transferId: t.text().notNull(),
    paymentUrl: t.text().notNull(),
    qrCode: t.text(),
    createdAt: t.timestamp().notNull().defaultNow(),
    status: t.text().notNull().default("PENDING"),
    amount: t.doublePrecision().notNull(),
    currency: t.text().notNull(),
  }),
  (t) => ({
    userIdIdx: index("payment_user_id_idx").on(t.userId),
    statusIdx: index("payment_status_idx").on(t.status),
  }),
);

export const CreatePaymentSchema = createInsertSchema(Payment).omit({
  id: true,
  createdAt: true,
});
