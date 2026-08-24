import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { generateMonthlySummary } from "@/lib/ai";
import { createNotification } from "@/lib/notifications";

export async function POST() {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const now = new Date();
    const monthName = now.toLocaleDateString("en-US", { month: "long" });

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      include: { category: { select: { name: true, icon: true, color: true } } },
    });

    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= monthStart;
    });
    const prevTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= prevMonthStart && d <= prevMonthEnd;
    });

    const income = monthTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const prevIncome = prevTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const prevExpenses = prevTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    const prevSavings = prevIncome - prevExpenses;

    const catMap = new Map<string, number>();
    for (const t of monthTx) {
      if (t.type !== "EXPENSE") continue;
      const name = t.category?.name ?? "Uncategorized";
      catMap.set(name, (catMap.get(name) ?? 0) + t.amount);
    }
    const topCategories = Array.from(catMap.entries())
      .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const biggestTransactions = [...monthTx]
      .filter((t) => t.type === "EXPENSE")
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((t) => ({ description: t.description, amount: t.amount }));

    const budgets = await db.budget.findMany({
      where: { userId: user.id, period: "MONTHLY" },
      include: { category: true },
    });
    const budgetPerformance = budgets.map((b) => {
      const spent = monthTx
        .filter((t) => t.categoryId === b.categoryId)
        .reduce((s, t) => s + t.amount, 0);
      return { name: b.category.name, budget: b.amount, spent: Math.round(spent * 100) / 100 };
    });

    const changes: string[] = [];
    if (prevExpenses > 0) {
      const pct = ((expenses - prevExpenses) / prevExpenses) * 100;
      changes.push(`Spending ${pct >= 0 ? "increased" : "decreased"} by ${Math.abs(Math.round(pct))}% compared with last month.`);
    }
    if (prevIncome > 0) {
      const pct = ((income - prevIncome) / prevIncome) * 100;
      changes.push(`Income ${pct >= 0 ? "increased" : "decreased"} by ${Math.abs(Math.round(pct))}% compared with last month.`);
    }

    const positives: string[] = [];
    if (savings > prevSavings) positives.push("Your savings increased this month");
    if (topCategories[0]) positives.push(`Your largest expense category was ${topCategories[0].name}`);
    const withinBudgets = budgetPerformance.filter((b) => b.spent <= b.budget).length;
    if (budgetPerformance.length > 0)
      positives.push(`You stayed within ${withinBudgets} of ${budgetPerformance.length} budgets`);

    const improvements: string[] = [];
    const topCat = topCategories[0];
    if (topCat && budgetPerformance.length > 0) {
      const overBudget = budgetPerformance.find((b) => b.name === topCat.name && b.spent > b.budget);
      if (overBudget) improvements.push(`${topCat.name} exceeded its budget by ${Math.round(overBudget.spent - overBudget.budget)}`);
    }
    if (savingsRate < 20) improvements.push("Consider increasing your savings rate");

    const result = await generateMonthlySummary({
      month: monthName,
      income,
      expenses,
      savings,
      savingsRate,
      topCategories,
      biggestTransactions,
      budgetPerformance,
      changes,
      positives,
      improvements,
      previousIncome: prevIncome,
      previousExpenses: prevExpenses,
      previousSavings: prevSavings,
    });

    if (result.ok && result.data) {
      await db.aIInsight.create({
        data: {
          userId: user.id,
          type: "MONTHLY_REPORT",
          title: `${monthName} Summary`,
          content: result.data,
          period: `${now.getFullYear()}-${now.getMonth() + 1}`,
        },
      });

      await createNotification(user.id, {
        type: "MONTHLY_REPORT",
        title: "Your monthly report is ready",
        message: `Your ${monthName} financial summary has been generated.`,
        actionUrl: "/insights",
      });

      return NextResponse.json({ report: result.data, source: result.source });
    }

    return NextResponse.json(
      { error: result.error ?? "Unable to generate report" },
      { status: 503 }
    );
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}