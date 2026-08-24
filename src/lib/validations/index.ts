import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"], {
    message: "Transaction type is required",
  }),
  amount: z
    .number({ message: "Amount is required" })
    .positive("Amount must be a positive number")
    .max(100000000, "Amount is too large"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description is too long"),
  categoryId: z.string().nullable().optional(),
  merchant: z.string().max(150, "Merchant is too long").optional().or(z.literal("")),
  paymentMethod: z
    .enum(["CASH", "BANK", "CREDIT_CARD", "DEBIT_CARD", "DIGITAL_WALLET", "OTHER"])
    .default("BANK"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().max(500, "Notes are too long").optional().or(z.literal("")),
  isRecurring: z.boolean().optional().default(false),
  currency: z.string().max(3).optional().default("USD"),
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.number().positive("Budget amount must be positive"),
  period: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]).default("MONTHLY"),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
});

export const goalSchema = z.object({
  name: z.string().min(1, "Goal name is required").max(100),
  targetAmount: z.number().positive("Target amount must be positive"),
  currentAmount: z.number().min(0, "Current amount cannot be negative").default(0),
  targetDate: z.string().optional().nullable(),
  description: z.string().max(500).optional().or(z.literal("")),
  icon: z.string().optional().default("Target"),
  color: z.string().optional().default("#10b981"),
});

export const recurringTransactionSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["INCOME", "EXPENSE"]),
  frequency: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]),
  nextDate: z.coerce.date(),
  categoryId: z.string().nullable().optional(),
  active: z.boolean().optional().default(true),
});

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  currency: z.string().min(3).max(3),
  dateFormat: z.string().optional(),
  language: z.string().optional(),
  onboarded: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type RecurringInput = z.infer<typeof recurringTransactionSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;