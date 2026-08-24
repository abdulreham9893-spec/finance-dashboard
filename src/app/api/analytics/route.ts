import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import {
  monthlySeries,
  spendingByCategory,
  largestExpenses,
  averageDailySpending,
  percentChange,
  type TransactionWithCategory,
} from "@/lib/calculations";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();

  const fullUser = await db.user.findUnique({ where: { id: user.id } });
  const currency = fullUser?.currency ?? "USD";

  const transactions = (await db.transaction.findMany({
    where: { userId: user.id },
    include: { category: { select: { name: true, icon: true, color: true } } },
  })) as TransactionWithCategory[];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= monthStart;
  });
  const prevTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= prevMonthStart && d <= prevMonthEnd;
  });

  const currentIncome = monthTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const currentExpenses = monthTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const prevIncome = prevTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const prevExpenses = prevTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const currentSavings = currentIncome - currentExpenses;
  const prevSavings = prevIncome - prevExpenses;

  const monthSeries = monthlySeries(transactions, 6);

  const categorySpending = spendingByCategory(monthTx);
  const categoryCompare = spendingByCategory(prevTx);

  const monthOverMonth = categorySpending.map((c) => {
    const prev = categoryCompare.find(
      (p) => p.categoryName === c.categoryName
    );
    return {
      name: c.categoryName,
      total: c.total,
      changePct: percentChange(c.total, prev?.total ?? 0),
    };
  });

  const topExpenses = largestExpenses(transactions, 10);
  const avgDaily = averageDailySpending(monthTx);
  const expenseCount = monthTx.filter((t) => t.type === "EXPENSE").length;

  const last12 = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const mTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d < end;
    });
    const inc = mTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const exp = mTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    last12.push({
      month: start.toLocaleDateString("en-US", { month: "short" }),
      income: Math.round(inc * 100) / 100,
      expenses: Math.round(exp * 100) / 100,
      savings: Math.round((inc - exp) * 100) / 100,
    });
  }

  // Financial health score
  const budgets = await db.budget.findMany({
    where: { userId: user.id, period: "MONTHLY" },
    include: { category: true },
  });
  const budgetAdherence =
    budgets.length > 0
      ? (budgets.filter((b) => {
          const spent = monthTx
            .filter((t) => t.categoryId === b.categoryId)
            .reduce((s, t) => s + t.amount, 0);
          return spent <= b.amount;
        }).length /
          budgets.length) *
        100
      : 70;

  const savingsRate = currentIncome > 0 ? (currentSavings / currentIncome) * 100 : 0;
  const spendingGrowth = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0;

  const goals = await db.goal.findMany({ where: { userId: user.id } });
  const goalProgress =
    goals.length > 0
      ? goals.reduce((s, g) => s + (g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0), 0) /
        goals.length
      : 20;

  const dailyMap = new Map<string, number>();
  for (const t of monthTx) {
    if (t.type !== "EXPENSE") continue;
    const day = new Date(t.date).toISOString().split("T")[0];
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  }
  const daysWithSpending = dailyMap.size;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const spendingFrequency = daysInMonth > 0 ? Math.round((daysWithSpending / daysInMonth) * 100) : 0;

  return NextResponse.json({
    currency,
    monthlySeries: monthSeries,
    last12,
    monthOverMonth,
    categorySpending,
    topExpenses: topExpenses.map((t) => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      date: t.date,
      categoryName: t.category?.name ?? "Uncategorized",
    })),
    stats: {
      currentIncome,
      currentExpenses,
      currentSavings,
      prevIncome,
      prevExpenses,
      prevSavings,
      savingsRate: Math.round(savingsRate * 10) / 10,
      averageDailySpending: avgDaily,
      expenseCount,
      spendingFrequency,
      incomeChange: Math.round(percentChange(currentIncome, prevIncome) * 10) / 10,
      expenseChange: Math.round(percentChange(currentExpenses, prevExpenses) * 10) / 10,
      savingsChange: Math.round(percentChange(currentSavings, prevSavings) * 10) / 10,
    },
    healthScore: {
      score: Math.round(
        budgetAdherence * 0.25 +
          Math.min(savingsRate, 100) * 0.25 +
          (spendingFrequency >= 20 && spendingFrequency <= 80 ? 100 : Math.max(30, 100 - Math.abs(spendingFrequency - 50))) *
            0.15 +
          (spendingGrowth < 0 ? 100 : Math.max(30, 100 - spendingGrowth)) * 0.2 +
          Math.min(goalProgress, 100) * 0.15
      ),
      components: {
        budgetAdherence: Math.round(budgetAdherence),
        savingsRate: Math.round(Math.min(savingsRate, 100)),
        expenseConsistency: Math.round(
          spendingFrequency >= 20 && spendingFrequency <= 80
            ? 100
            : Math.max(30, 100 - Math.abs(spendingFrequency - 50))
        ),
        spendingGrowth: Math.round(spendingGrowth < 0 ? 100 : Math.max(30, 100 - spendingGrowth)),
        emergencyFundProgress: Math.round(Math.min(goalProgress, 100)),
      },
    },
  });
}