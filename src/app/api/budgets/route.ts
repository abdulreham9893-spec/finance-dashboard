import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { budgetSchema } from "@/lib/validations";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const budgets = await db.budget.findMany({
    where: { userId: user.id, period: "MONTHLY" },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });

  const expenses = await db.transaction.findMany({
    where: {
      userId: user.id,
      type: "EXPENSE",
      date: { gte: monthStart, lte: monthEnd },
    },
    include: { category: true },
  });

  const daysInMonth = monthEnd.getDate();
  const today = now.getDate();
  const daysRemaining = Math.max(daysInMonth - today, 0);

  const data = budgets.map((budget) => {
    const spent = expenses
      .filter((t) => t.categoryId === budget.categoryId)
      .reduce((sum, t) => sum + t.amount, 0);
    const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const remaining = budget.amount - spent;

    return {
      id: budget.id,
      categoryId: budget.categoryId,
      categoryName: budget.category.name,
      categoryIcon: budget.category.icon,
      categoryColor: budget.category.color,
      amount: budget.amount,
      spent: Math.round(spent * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      pct: Math.round(pct),
      status:
        pct >= 100 ? "exceeded" : pct >= 90 ? "danger" : pct >= 70 ? "warning" : "ok",
      period: budget.period,
      daysRemaining,
      transactionCount: expenses.filter((t) => t.categoryId === budget.categoryId).length,
    };
  });

  return NextResponse.json({ budgets: data });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = budgetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const category = await db.category.findFirst({
      where: { id: data.categoryId, userId: user.id },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const existing = await db.budget.findFirst({
      where: { userId: user.id, categoryId: data.categoryId, period: data.period },
    });

    if (existing) {
      const budget = await db.budget.update({
        where: { id: existing.id },
        data: {
          amount: data.amount,
          startDate: data.startDate ?? new Date(),
          endDate: data.endDate ?? null,
        },
      });
      return NextResponse.json({ budget });
    }

    const budget = await db.budget.create({
      data: {
        userId: user.id,
        categoryId: data.categoryId,
        amount: data.amount,
        period: data.period,
        startDate: data.startDate ?? new Date(),
        endDate: data.endDate ?? null,
      },
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}