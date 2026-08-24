import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await db.recurringTransaction.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Recurring transaction not found" }, { status: 404 });
  }

  const body = await request.json();
  const recurring = await db.recurringTransaction.update({
    where: { id },
    data: {
      ...(body.description !== undefined && { description: body.description }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.frequency !== undefined && { frequency: body.frequency }),
      ...(body.nextDate !== undefined && { nextDate: new Date(body.nextDate) }),
      ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
      ...(body.active !== undefined && { active: body.active }),
    },
    include: { category: { select: { name: true, icon: true, color: true } } },
  });

  return NextResponse.json({ recurring });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await db.recurringTransaction.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Recurring transaction not found" }, { status: 404 });
  }

  await db.recurringTransaction.delete({ where: { id } });
  return NextResponse.json({ message: "Recurring transaction deleted" });
}