import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { transactionSchema } from "@/lib/validations";
import { checkBudgetAlerts } from "@/app/api/transactions/route";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const transaction = await db.transaction.findFirst({
    where: { id, userId: user.id },
    include: { category: { select: { name: true, icon: true, color: true } } },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  return NextResponse.json({ transaction });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await db.transaction.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = transactionSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const transaction = await db.transaction.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { type: data.type }),
        ...(data.amount !== undefined && { amount: Math.round(data.amount * 100) / 100 }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
        ...(data.merchant !== undefined && { merchant: data.merchant?.trim() || null }),
        ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
        ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
      },
      include: { category: { select: { name: true, icon: true, color: true } } },
    });

    return NextResponse.json({ transaction });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await db.transaction.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  await db.transaction.delete({ where: { id } });
  await checkBudgetAlerts(user.id);

  return NextResponse.json({ message: "Transaction deleted" });
}