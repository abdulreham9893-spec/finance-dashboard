import type { Transaction, Budget } from "@prisma/client";

export interface TransactionWithCategory extends Transaction {
  category?: { name: string; icon: string; color: string } | null;
}

export interface MonthSummary {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  transactionCount: number;
}

export function sumIncome(transactions: TransactionWithCategory[]): number {
  return transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function sumExpenses(transactions: TransactionWithCategory[]): number {
  return transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateSavings(income: number, expenses: number): number {
  return income - expenses;
}

export function savingsRate(income: number, savings: number): number {
  if (income <= 0) return 0;
  return (savings / income) * 100;
}

export function budgetPercentage(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return (spent / budget) * 100;
}

export function remainingBudget(spent: number, budget: number): number {
  return budget - spent;
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

export function buildMonthSummary(
  transactions: TransactionWithCategory[]
): MonthSummary {
  const income = sumIncome(transactions);
  const expenses = sumExpenses(transactions);
  const savings = calculateSavings(income, expenses);
  return {
    income,
    expenses,
    savings,
    savingsRate: savingsRate(income, savings),
    transactionCount: transactions.length,
  };
}

export interface SpendingByCategory {
  categoryId: string | null;
  categoryName: string;
  icon: string;
  color: string;
  total: number;
  count: number;
}

export function spendingByCategory(
  transactions: TransactionWithCategory[]
): SpendingByCategory[] {
  const map = new Map<string, SpendingByCategory>();

  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    const key = t.categoryId ?? "uncategorized";
    const existing = map.get(key);
    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
    } else {
      map.set(key, {
        categoryId: t.categoryId,
        categoryName: t.category?.name ?? "Uncategorized",
        icon: t.category?.icon ?? "MoreHorizontal",
        color: t.category?.color ?? "#6b7280",
        total: t.amount,
        count: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export interface DailySpending {
  date: string;
  total: number;
}

export function dailySpending(
  transactions: TransactionWithCategory[],
  days: number
): DailySpending[] {
  const result: DailySpending[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);

    const total = transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d >= day && d < next && t.type === "EXPENSE";
      })
      .reduce((sum, t) => sum + t.amount, 0);

    result.push({
      date: day.toISOString().split("T")[0],
      total: Math.round(total * 100) / 100,
    });
  }

  return result;
}

export interface MonthlySeries {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export function monthlySeries(
  transactions: TransactionWithCategory[],
  months: number = 6
): MonthlySeries[] {
  const result: MonthlySeries[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= month && d < next;
    });

    const income = sumIncome(monthTx);
    const expenses = sumExpenses(monthTx);

    result.push({
      month: month.toLocaleDateString("en-US", { month: "short" }),
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      savings: Math.round((income - expenses) * 100) / 100,
    });
  }

  return result;
}

export function currentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function previousMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { start, end };
}

export function largestExpenses(
  transactions: TransactionWithCategory[],
  limit: number = 10
): TransactionWithCategory[] {
  return transactions
    .filter((t) => t.type === "EXPENSE")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export function averageDailySpending(
  transactions: TransactionWithCategory[]
): number {
  if (transactions.length === 0) return 0;
  const expenses = sumExpenses(transactions);
  const dates = new Set(
    transactions.map((t) => new Date(t.date).toISOString().split("T")[0])
  );
  const days = Math.max(dates.size, 1);
  return Math.round((expenses / days) * 100) / 100;
}

export function financialHealthScore(metrics: {
  budgetAdherence: number;
  savingsRate: number;
  expenseConsistency: number;
  spendingGrowth: number;
  emergencyFundProgress: number;
}): { score: number; components: Record<string, number> } {
  const components = {
    budgetAdherence: clamp(metrics.budgetAdherence, 0, 100),
    savingsRate: clamp(metrics.savingsRate, 0, 100),
    expenseConsistency: clamp(metrics.expenseConsistency, 0, 100),
    spendingGrowth: clamp(100 - Math.abs(metrics.spendingGrowth), 0, 100),
    emergencyFundProgress: clamp(metrics.emergencyFundProgress, 0, 100),
  };

  const score = Math.round(
    (components.budgetAdherence * 0.25 +
      components.savingsRate * 0.25 +
      components.expenseConsistency * 0.15 +
      components.spendingGrowth * 0.2 +
      components.emergencyFundProgress * 0.15)
  );

  return { score, components };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function budgetStatus(
  budget: Budget & { category?: { name: string } | null },
  spent: number
) {
  const categoryName = budget.category?.name ?? "budget";
  const pct = budgetPercentage(spent, budget.amount);
  const remaining = remainingBudget(spent, budget.amount);

  let status: "ok" | "warning" | "danger" | "exceeded";
  if (pct >= 100) {
    status = "exceeded";
  } else if (pct >= 90) {
    status = "danger";
  } else if (pct >= 70) {
    status = "warning";
  } else {
    status = "ok";
  }

  let message: string;
  if (pct >= 100) {
    const over = Math.round((pct - 100) * budget.amount) / 100;
    message = over > 0
      ? `You've exceeded your ${categoryName} budget by ${formatAmount(over, "USD")}.`
      : `You've reached your ${categoryName} budget.`;
  } else if (pct >= 90) {
    message = `You're close to reaching your ${categoryName} budget.`;
  } else if (pct >= 70) {
    message = `You've used ${Math.round(pct)}% of your ${categoryName} budget.`;
  } else {
    message = `You're on track with your ${categoryName} budget.`;
  }

  return { pct, remaining, status, message };
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}