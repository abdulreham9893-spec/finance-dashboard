import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { transactionSchema } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";
import { processDueRecurring } from "@/lib/recurring";

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  await processDueRecurring(user.id);

  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") ?? "20"), 1), 100);
  const search = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("category");
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const sort = searchParams.get("sort") ?? "newest";

  const where: Record<string, unknown> = { userId: user.id };

  if (search) {
    where.OR = [
      { description: { contains: search } },
      { merchant: { contains: search } },
      { notes: { contains: search } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (type) where.type = type;
  if (from || to) {
    const dateRange: { gte?: Date; lte?: Date } = {};
    if (from) dateRange.gte = new Date(from);
    if (to) dateRange.lte = new Date(to);
    where.date = dateRange;
  }

  const orderBy =
    sort === "amount"
      ? { amount: "desc" as const }
      : sort === "amountAsc"
        ? { amount: "asc" as const }
        : { date: "desc" as const };

  const [transactions, total] = await Promise.all([
    db.transaction.findMany({
      where,
      include: { category: { select: { name: true, icon: true, color: true } } },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.transaction.count({ where }),
  ]);

  return NextResponse.json({
    transactions,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = transactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const fullUser = await db.user.findUnique({ where: { id: user.id } });
    const currency = data.currency ?? fullUser?.currency ?? "USD";

    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        type: data.type,
        amount: Math.round(data.amount * 100) / 100,
        description: data.description.trim(),
        categoryId: data.categoryId || null,
        merchant: data.merchant?.trim() || null,
        paymentMethod: data.paymentMethod,
        date: new Date(data.date),
        notes: data.notes?.trim() || null,
        isRecurring: data.isRecurring ?? false,
        currency,
      },
      include: { category: { select: { name: true, icon: true, color: true } } },
    });

    await checkBudgetAlerts(user.id);

    return NextResponse.json({ transaction }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function checkBudgetAlerts(userId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const budgets = await db.budget.findMany({
    where: { userId, period: "MONTHLY" },
    include: { category: true },
  });

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: monthStart, lte: monthEnd },
    },
    include: { category: true },
  });

  for (const budget of budgets) {
    const spent = transactions
      .filter((t) => t.categoryId === budget.categoryId)
      .reduce((sum, t) => sum + t.amount, 0);

    const pct = (spent / budget.amount) * 100;

    const existingAlert = await db.notification.findFirst({
      where: {
        userId,
        type: "BUDGET_WARNING",
        title: { contains: budget.category.name },
        createdAt: { gte: monthStart },
      },
    });

    const shouldAlert =
      (pct >= 70 && pct < 90) ||
      (pct >= 90 && pct < 100) ||
      pct >= 100;

    if (shouldAlert && !existingAlert) {
      const over = spent - budget.amount;
      let title: string;
      let message: string;

      if (pct >= 100) {
        title = `Budget exceeded: ${budget.category.name}`;
        message =
          over > 0
            ? `You've exceeded your ${budget.category.name} budget by ${formatMoney(over)}.`
            : `You've reached your ${budget.category.name} budget.`;
      } else if (pct >= 90) {
        title = `Almost there: ${budget.category.name}`;
        message = `You're close to reaching your ${budget.category.name} budget (${Math.round(pct)}%).`;
      } else {
        title = `Budget at ${Math.round(pct)}%: ${budget.category.name}`;
        message = `You've used ${Math.round(pct)}% of your ${budget.category.name} budget.`;
      }

      await createNotification(userId, {
        type: "BUDGET_WARNING",
        title,
        message,
        actionUrl: "/budgets",
      });
    }
  }
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}