import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { analyzeSpending } from "@/lib/ai";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();

  const insights = await db.aIInsight.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ insights });
}

export async function POST() {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
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
    const prevIncome = prevTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const prevExpenses = prevTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    const catMap = new Map<string, { name: string; amount: number; prev: number }>();
    for (const t of monthTx) {
      if (t.type !== "EXPENSE") continue;
      const name = t.category?.name ?? "Uncategorized";
      const entry = catMap.get(name) ?? { name, amount: 0, prev: 0 };
      entry.amount += t.amount;
      catMap.set(name, entry);
    }
    for (const t of prevTx) {
      if (t.type !== "EXPENSE") continue;
      const name = t.category?.name ?? "Uncategorized";
      const entry = catMap.get(name) ?? { name, amount: 0, prev: 0 };
      entry.prev += t.amount;
      catMap.set(name, entry);
    }

    const categories = Array.from(catMap.values()).map((c) => ({
      name: c.name,
      amount: Math.round(c.amount * 100) / 100,
      changePct: c.prev > 0 ? Math.round(((c.amount - c.prev) / c.prev) * 1000) / 10 : c.amount > 0 ? 100 : 0,
    }));

    const topExpenses = [...monthTx]
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

    const daysInMonth = monthStart.getDate() - 0;
    void daysInMonth;
    const dateCount = new Set(monthTx.map((t) => new Date(t.date).toISOString().split("T")[0])).size;
    const avgDaily = dateCount > 0 ? expenses / dateCount : 0;

    const result = await analyzeSpending({
      totalIncome: income,
      totalExpenses: expenses,
      savings,
      savingsRate,
      previousIncome: prevIncome,
      previousExpenses: prevExpenses,
      categories,
      month: now.toLocaleDateString("en-US", { month: "long" }),
      previousMonth: new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString("en-US", {
        month: "long",
      }),
      topExpenses,
      transactionCount: monthTx.length,
      subscriptions,
      averageDailySpending: avgDaily,
    });

    if (result.ok && result.data) {
      for (const insight of result.data) {
        await db.aIInsight.create({
          data: {
            userId: user.id,
            type: insight.type,
            title: insight.title,
            content: insight.content,
            period: `${now.getFullYear()}-${now.getMonth() + 1}`,
          },
        });
      }

      await createNotification(user.id, {
        type: "AI_INSIGHT",
        title: "New AI insights ready",
        message: `Your AI analysis for ${now.toLocaleDateString("en-US", { month: "long" })} is ready.`,
        actionUrl: "/insights",
      });

      return NextResponse.json({ insights: result.data, source: result.source });
    }

    return NextResponse.json(
      { error: result.error ?? "AI insights are temporarily unavailable" },
      { status: 503 }
    );
  } catch {
    return NextResponse.json(
      { error: "AI insights are temporarily unavailable" },
      { status: 500 }
    );
  }
}