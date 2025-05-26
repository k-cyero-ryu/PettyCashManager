import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["custodian", "accountant", "admin"] }).notNull().default("custodian"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  receivedBy: varchar("received_by").notNull(),
  paymentMethod: varchar("payment_method", { enum: ["cash", "check", "card"] }).notNull(),
  receiptUrl: varchar("receipt_url"),
  receiptFileName: varchar("receipt_file_name"),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  submittedBy: varchar("submitted_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  comments: text("comments"),
  runningBalance: decimal("running_balance", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Replenishment requests table
export const replenishmentRequests = pgTable("replenishment_requests", {
  id: serial("id").primaryKey(),
  requestedAmount: decimal("requested_amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Settings table for application configuration
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: text("value").notNull(),
  updatedBy: varchar("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  submittedTransactions: many(transactions, { relationName: "submittedTransactions" }),
  approvedTransactions: many(transactions, { relationName: "approvedTransactions" }),
  replenishmentRequests: many(replenishmentRequests, { relationName: "requestedReplenishments" }),
  approvedReplenishments: many(replenishmentRequests, { relationName: "approvedReplenishments" }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  submitter: one(users, {
    fields: [transactions.submittedBy],
    references: [users.id],
    relationName: "submittedTransactions",
  }),
  approver: one(users, {
    fields: [transactions.approvedBy],
    references: [users.id],
    relationName: "approvedTransactions",
  }),
}));

export const replenishmentRequestsRelations = relations(replenishmentRequests, ({ one }) => ({
  requester: one(users, {
    fields: [replenishmentRequests.requestedBy],
    references: [users.id],
    relationName: "requestedReplenishments",
  }),
  approver: one(users, {
    fields: [replenishmentRequests.approvedBy],
    references: [users.id],
    relationName: "approvedReplenishments",
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  status: true,
  submittedBy: true,
  approvedBy: true,
  approvedAt: true,
  runningBalance: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.string().min(1, "Date is required"),
});

export const updateTransactionStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  comments: z.string().optional(),
});

export const insertReplenishmentRequestSchema = createInsertSchema(replenishmentRequests).omit({
  id: true,
  status: true,
  requestedBy: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type UpdateTransactionStatus = z.infer<typeof updateTransactionStatusSchema>;
export type InsertReplenishmentRequest = z.infer<typeof insertReplenishmentRequestSchema>;
export type ReplenishmentRequest = typeof replenishmentRequests.$inferSelect;
export type Setting = typeof settings.$inferSelect;
