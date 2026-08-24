import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { chatWithAssistant } from "@/lib/ai";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const { question } = await request.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const now = new Date();
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
    const prevExpenses = prevTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    const catMap = new Map<string, number>();
    for (const t of monthTx) {
      if (t.type !== "EXPENSE") continue;
      const name = t.category?.name ?? "Uncategorized";
      catMap.set(name, (catMap.get(name) ?? 0) + t.amount);
    }
    const topCategories = Array.from(catMap.entries())
      .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    const largestExpenses = [...monthTx]
      .filter((t) => t.type === "EXPENSE")
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((t) => ({ description: t.description, amount: t.amount }));

    const subscriptions = monthTx.filter(
      (t) =>
        t.type === "EXPENSE" &&
        /netflix|spotify|youtube|prime|disney|hulu|apple|google|dropbox|adobe|microsoft|internet|phone|subscription/i.test(
          t.description
        )
    ).map((t) => ({ description: t.description, amount: t.amount }));

    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const mTx = transactions.filter((t) => {
        const d = new Date(t.date);
        return d >= start && d < end;
      });
      const inc = mTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
      const exp = mTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
      monthlyTrend.push({
        month: start.toLocaleDateString("en-US", { month: "short" }),
        income: Math.round(inc * 100) / 100,
        expenses: Math.round(exp * 100) / 100,
        savings: Math.round((inc - exp) * 100) / 100,
      });
    }

    const dateCount = new Set(monthTx.map((t) => new Date(t.date).toISOString().split("T")[0])).size;
    const avgDaily = dateCount > 0 ? expenses / dateCount : 0;

    const result = await chatWithAssistant({
      question,
      monthlyStats: {
        income,
        expenses,
        savings,
        savingsRate,
        topCategories,
        largestExpenses,
        subscriptions,
        monthlyTrend,
        previousExpenses: prevExpenses,
        averageDailySpending: avgDaily,
        transactionCount: monthTx.length,
      },
    });

    if (result.ok) {
      return NextResponse.json({ answer: result.data });
    }
    return NextResponse.json(
      { error: result.error ?? "AI assistant is temporarily unavailable" },
      { status: 503 }
    );
  } catch {
    return NextResponse.json(
      { error: "AI assistant is temporarily unavailable" },
      { status: 500 }
    );
  }
}