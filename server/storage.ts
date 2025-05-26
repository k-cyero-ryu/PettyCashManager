import {
  users,
  transactions,
  replenishmentRequests,
  settings,
  type User,
  type UpsertUser,
  type Transaction,
  type InsertTransaction,
  type UpdateTransactionStatus,
  type ReplenishmentRequest,
  type InsertReplenishmentRequest,
  type Setting,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction, submittedBy: string): Promise<Transaction>;
  getTransactions(filters?: {
    status?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  updateTransactionStatus(id: number, update: UpdateTransactionStatus, approvedBy: string): Promise<Transaction>;
  getTransactionStats(): Promise<{
    currentBalance: number;
    monthlyTotal: number;
    pendingCount: number;
    averageTransaction: number;
    totalTransactions: number;
  }>;
  
  // Replenishment operations
  createReplenishmentRequest(request: InsertReplenishmentRequest, requestedBy: string): Promise<ReplenishmentRequest>;
  getReplenishmentRequests(status?: string): Promise<ReplenishmentRequest[]>;
  updateReplenishmentStatus(id: number, status: string, approvedBy: string, comments?: string): Promise<ReplenishmentRequest>;
  
  // Settings operations
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string, updatedBy: string): Promise<Setting>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction, submittedBy: string): Promise<Transaction> {
    // Calculate running balance
    const latestTransaction = await db
      .select({ balance: transactions.runningBalance })
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(1);

    const currentBalance = latestTransaction[0]?.balance ? parseFloat(latestTransaction[0].balance) : 0;
    const transactionAmount = parseFloat(transaction.amount);
    const newBalance = currentBalance + transactionAmount; // Add positive amounts (replenishments), subtract negative amounts (expenses)

    const [newTransaction] = await db
      .insert(transactions)
      .values({
        ...transaction,
        submittedBy,
        runningBalance: newBalance.toFixed(2),
      })
      .returning();

    return newTransaction;
  }

  async getTransactions(filters?: {
    status?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    let query = db
      .select({
        id: transactions.id,
        date: transactions.date,
        description: transactions.description,
        amount: transactions.amount,
        receivedBy: transactions.receivedBy,
        paymentMethod: transactions.paymentMethod,
        receiptUrl: transactions.receiptUrl,
        receiptFileName: transactions.receiptFileName,
        status: transactions.status,
        submittedBy: transactions.submittedBy,
        approvedBy: transactions.approvedBy,
        approvedAt: transactions.approvedAt,
        comments: transactions.comments,
        runningBalance: transactions.runningBalance,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        submitterName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('submitterName'),
        submitterEmail: users.email,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.submittedBy, users.id));

    if (filters?.status) {
      query = query.where(eq(transactions.status, filters.status as "pending" | "approved" | "rejected"));
    }
    if (filters?.userId) {
      query = query.where(eq(transactions.submittedBy, filters.userId));
    }

    query = query.orderBy(desc(transactions.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction;
  }

  async updateTransactionStatus(id: number, update: UpdateTransactionStatus, approvedBy: string): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set({
        ...update,
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id))
      .returning();

    return transaction;
  }

  async getTransactionStats(): Promise<{
    currentBalance: number;
    monthlyTotal: number;
    pendingCount: number;
    averageTransaction: number;
    totalTransactions: number;
  }> {
    // Get current balance from latest approved transaction
    const latestTransaction = await db
      .select({ balance: transactions.runningBalance })
      .from(transactions)
      .where(eq(transactions.status, "approved"))
      .orderBy(desc(transactions.createdAt))
      .limit(1);

    const currentBalance = latestTransaction[0]?.balance ? parseFloat(latestTransaction[0].balance) : 0;

    // Get monthly total (current month expenses)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyStats = await db
      .select({
        total: sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END)`,
        count: sql`COUNT(*)`,
      })
      .from(transactions)
      .where(
        eq(transactions.status, "approved")
      );

    const monthlyTotal = monthlyStats[0]?.total ? parseFloat(monthlyStats[0].total) : 0;

    // Get pending count
    const pendingResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(transactions)
      .where(eq(transactions.status, "pending"));

    const pendingCount = pendingResult[0]?.count ? parseInt(pendingResult[0].count) : 0;

    // Get average transaction amount
    const avgResult = await db
      .select({
        avg: sql`AVG(ABS(${transactions.amount}))`,
        total: sql`COUNT(*)`,
      })
      .from(transactions)
      .where(eq(transactions.status, "approved"));

    const averageTransaction = avgResult[0]?.avg ? parseFloat(avgResult[0].avg) : 0;
    const totalTransactions = avgResult[0]?.total ? parseInt(avgResult[0].total) : 0;

    return {
      currentBalance,
      monthlyTotal,
      pendingCount,
      averageTransaction,
      totalTransactions,
    };
  }

  // Replenishment operations
  async createReplenishmentRequest(request: InsertReplenishmentRequest, requestedBy: string): Promise<ReplenishmentRequest> {
    const [newRequest] = await db
      .insert(replenishmentRequests)
      .values({
        ...request,
        requestedBy,
      })
      .returning();

    return newRequest;
  }

  async getReplenishmentRequests(status?: string): Promise<ReplenishmentRequest[]> {
    let query = db.select().from(replenishmentRequests);

    if (status) {
      query = query.where(eq(replenishmentRequests.status, status));
    }

    return await query.orderBy(desc(replenishmentRequests.createdAt));
  }

  async updateReplenishmentStatus(id: number, status: string, approvedBy: string, comments?: string): Promise<ReplenishmentRequest> {
    const [request] = await db
      .update(replenishmentRequests)
      .set({
        status,
        approvedBy,
        approvedAt: new Date(),
        comments,
        updatedAt: new Date(),
      })
      .where(eq(replenishmentRequests.id, id))
      .returning();

    // If approved, create a credit transaction
    if (status === "approved") {
      await this.createTransaction(
        {
          date: new Date(),
          description: `Cash replenishment - ${request.reason}`,
          amount: request.requestedAmount,
          receivedBy: "Cash Float",
          paymentMethod: "cash",
        },
        approvedBy
      );
    }

    return request;
  }

  // Settings operations
  async getSetting(key: string): Promise<string | undefined> {
    const [setting] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, key));
    return setting?.value;
  }

  async setSetting(key: string, value: string, updatedBy: string): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values({ key, value, updatedBy })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedBy, updatedAt: new Date() },
      })
      .returning();

    return setting;
  }
}

export const storage = new DatabaseStorage();
