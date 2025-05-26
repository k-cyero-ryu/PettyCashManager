import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertTransactionSchema, updateTransactionStatusSchema, insertReplenishmentRequestSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only .png, .jpg, .jpeg and .pdf files are allowed!"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files
  app.use("/uploads", isAuthenticated, (req, res, next) => {
    // Add additional security checks here if needed
    next();
  });
  app.use("/uploads", express.static(uploadDir));

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User management routes (Admin only)
  app.get("/api/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:userId/role", isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const admin = await storage.getUser(adminId);
      
      if (admin?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!["custodian", "accountant", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role, adminId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      console.log("🔍 API RECEIVED QUERY:", req.query);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      let filters: any = { limit: parseInt(limit), offset: parseInt(offset) };
      
      if (status) {
        filters.status = status;
        console.log("✅ STATUS FILTER APPLIED:", status);
      } else {
        console.log("❌ NO STATUS FILTER");
      }

      // If user is custodian, only show their own transactions
      if (user?.role === "custodian") {
        filters.userId = userId;
      }

      console.log("📋 FINAL FILTERS:", filters);
      const transactions = await storage.getTransactions(filters);
      console.log("📦 RETURNED TRANSACTIONS COUNT:", transactions.length);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/stats", isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getTransactionStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching transaction stats:", error);
      res.status(500).json({ message: "Failed to fetch transaction stats" });
    }
  });

  app.post("/api/transactions", isAuthenticated, upload.single("receipt"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactionData = insertTransactionSchema.parse(req.body);

      let receiptUrl = undefined;
      let receiptFileName = undefined;

      if (req.file) {
        receiptUrl = `/uploads/${req.file.filename}`;
        receiptFileName = req.file.originalname;
      }

      const transaction = await storage.createTransaction(
        {
          ...transactionData,
          receiptUrl,
          receiptFileName,
        },
        userId
      );

      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });

  app.get("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  app.patch("/api/transactions/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // Only accountants and admins can approve/reject transactions
      if (user?.role === "custodian") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const updateData = updateTransactionStatusSchema.parse(req.body);

      const transaction = await storage.updateTransactionStatus(id, updateData, userId);
      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction status:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ message: "Invalid update data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update transaction status" });
      }
    }
  });

  // Replenishment routes
  app.get("/api/replenishments", isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.query;
      const replenishments = await storage.getReplenishmentRequests(status);
      res.json(replenishments);
    } catch (error) {
      console.error("Error fetching replenishment requests:", error);
      res.status(500).json({ message: "Failed to fetch replenishment requests" });
    }
  });

  app.post("/api/replenishments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestData = insertReplenishmentRequestSchema.parse(req.body);

      const request = await storage.createReplenishmentRequest(requestData, userId);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating replenishment request:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create replenishment request" });
      }
    }
  });

  app.patch("/api/replenishments/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // Only accountants and admins can approve/reject replenishments
      if (user?.role === "custodian") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const { status, comments } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const request = await storage.updateReplenishmentStatus(id, status, userId, comments);
      res.json(request);
    } catch (error) {
      console.error("Error updating replenishment status:", error);
      res.status(500).json({ message: "Failed to update replenishment status" });
    }
  });

  // Export routes
  app.get("/api/export/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const { startDate, endDate, status } = req.query;
      const filters: any = {};

      if (status) filters.status = status;

      const transactions = await storage.getTransactions(filters);

      // Filter by date range if provided
      let filteredTransactions = transactions;
      if (startDate || endDate) {
        filteredTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          if (startDate && transactionDate < new Date(startDate)) return false;
          if (endDate && transactionDate > new Date(endDate)) return false;
          return true;
        });
      }

      // Convert to CSV
      const csvHeaders = "Date,Description,Amount,Received By,Payment Method,Status,Balance,Submitted By";
      const csvRows = filteredTransactions.map(t => {
        return [
          t.date.toISOString().split('T')[0],
          `"${t.description.replace(/"/g, '""')}"`,
          t.amount,
          `"${t.receivedBy.replace(/"/g, '""')}"`,
          t.paymentMethod,
          t.status,
          t.runningBalance || "",
          `"${(t as any).submitterName || ""}"`,
        ].join(",");
      });

      const csvContent = [csvHeaders, ...csvRows].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting transactions:", error);
      res.status(500).json({ message: "Failed to export transactions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
