import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { generateBudgetAdvice } from "@/lib/ai";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const { categoryId } = await request.json();

    const category = await db.category.findFirst({
      where: { id: categoryId, userId: user.id },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const now = new Date();
    const historical: { month: string; amount: number }[] = [];
    const currentBudget = await db.budget.findFirst({
      where: { userId: user.id, categoryId, period: "MONTHLY" },
    });

    for (let i = 3; i >= 1; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthTx = await db.transaction.findMany({
        where: {
          userId: user.id,
          categoryId,
          type: "EXPENSE",
          date: { gte: start, lt: end },
        },
      });

      const amount = monthTx.reduce((sum, t) => sum + t.amount, 0);
      historical.push({
        month: start.toLocaleDateString("en-US", { month: "long" }),
        amount: Math.round(amount * 100) / 100,
      });
    }

    const result = await generateBudgetAdvice({
      category: category.name,
      historical,
      currentBudget: currentBudget?.amount ?? null,
    });

    if (result.ok && result.data) {
      return NextResponse.json({
        recommendedAmount: result.data.recommendedAmount,
        message: result.data.message,
        source: result.source,
      });
    }

    return NextResponse.json(
      { error: result.error ?? "Unable to generate recommendation" },
      { status: 503 }
    );
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}