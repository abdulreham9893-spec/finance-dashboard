import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { processDueRecurring } from "@/lib/recurring";
import {
  currentMonthRange,
  previousMonthRange,
  buildMonthSummary,
  spendingByCategory,
  dailySpending,
  percentChange,
  type TransactionWithCategory,
} from "@/lib/calculations";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();

  await processDueRecurring(user.id);

  const now = new Date();
  const { start, end } = currentMonthRange();
  const prev = previousMonthRange();

  const fullUser = await db.user.findUnique({ where: { id: user.id } });
  const currency = fullUser?.currency ?? "USD";

  const [monthTx, prevTx, budgets, goals, recurring, recentTx, categories, notifications] =
    await Promise.all([
      db.transaction.findMany({
        where: { userId: user.id, date: { gte: start, lte: end } },
        include: { category: { select: { name: true, icon: true, color: true } } },
      }),
      db.transaction.findMany({
        where: { userId: user.id, date: { gte: prev.start, lte: prev.end } },
        include: { category: { select: { name: true, icon: true, color: true } } },
      }),
      db.budget.findMany({
        where: { userId: user.id, period: "MONTHLY" },
        include: { category: true },
      }),
      db.goal.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      db.recurringTransaction.findMany({
        where: { userId: user.id, active: true },
        include: { category: { select: { name: true, icon: true, color: true } } },
        orderBy: { nextDate: "asc" },
        take: 5,
      }),
      db.transaction.findMany({
        where: { userId: user.id },
        include: { category: { select: { name: true, icon: true, color: true } } },
        orderBy: { date: "desc" },
        take: 6,
      }),
      db.category.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
      }),
      db.notification.count({ where: { userId: user.id, read: false } }),
    ]);

  const summary = buildMonthSummary(monthTx as TransactionWithCategory[]);
  const prevSummary = buildMonthSummary(prevTx as TransactionWithCategory[]);

  const monthExpenses = monthTx.filter((t) => t.type === "EXPENSE");
  const avgDaily =
    monthExpenses.length > 0
      ? Math.round(
          (summary.expenses /
            Math.max(new Set(monthExpenses.map((t) => new Date(t.date).toISOString().split("T")[0])).size, 1)) *
            100
        ) / 100
      : 0;

  const highestDay = dailySpending(monthTx as TransactionWithCategory[], now.getDate()).reduce(
    (max, d) => (d.total > max.total ? d : max),
    { date: "", total: 0 }
  );

  const categoriesWithSpending = spendingByCategory(monthTx as TransactionWithCategory[]);

  const budgetData = budgets.map((budget) => {
    const spent = monthExpenses
      .filter((t) => t.categoryId === budget.categoryId)
      .reduce((sum, t) => sum + t.amount, 0);
    const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    return {
      id: budget.id,
      categoryName: budget.category.name,
      categoryIcon: budget.category.icon,
      categoryColor: budget.category.color,
      amount: budget.amount,
      spent: Math.round(spent * 100) / 100,
      pct: Math.round(pct),
      status: pct >= 100 ? "exceeded" : pct >= 90 ? "danger" : pct >= 70 ? "warning" : "ok",
    };
  });

  const goalData = goals.map((g) => ({
    id: g.id,
    name: g.name,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    progress: g.targetAmount > 0 ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100) : 0,
    targetDate: g.targetDate,
    icon: g.icon,
    color: g.color,
  }));

  return NextResponse.json({
    currency,
    summary: {
      balance: Math.round(summary.savings * 100) / 100,
      income: Math.round(summary.income * 100) / 100,
      expenses: Math.round(summary.expenses * 100) / 100,
      savings: Math.round(summary.savings * 100) / 100,
      savingsRate: Math.round(summary.savingsRate * 10) / 10,
      changes: {
        income: Math.round(percentChange(summary.income, prevSummary.income) * 10) / 10,
        expenses: Math.round(percentChange(summary.expenses, prevSummary.expenses) * 10) / 10,
        savings: Math.round(percentChange(summary.savings, prevSummary.savings) * 10) / 10,
        balance: Math.round(percentChange(summary.savings, prevSummary.savings) * 10) / 10,
      },
    },
    spending: {
      total: Math.round(summary.expenses * 100) / 100,
      averageDaily: avgDaily,
      highestDay: highestDay.total > 0 ? { date: highestDay.date, total: highestDay.total } : null,
      daily: dailySpending(monthTx as TransactionWithCategory[], now.getDate()),
    },
    categories: categoriesWithSpending,
    budgets: budgetData,
    goals: goalData,
    recurring: recurring.map((r) => ({
      id: r.id,
      description: r.description,
      amount: r.amount,
      type: r.type,
      frequency: r.frequency,
      nextDate: r.nextDate,
      categoryName: r.category?.name ?? null,
      categoryIcon: r.category?.icon ?? null,
      categoryColor: r.category?.color ?? null,
    })),
    recentTransactions: recentTx,
    categoryList: categories,
    unreadNotifications: notifications,
  });
}