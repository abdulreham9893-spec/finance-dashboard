import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { budgetSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await db.budget.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = budgetSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }

    const budget = await db.budget.update({
      where: { id },
      data: {
        ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
        ...(parsed.data.categoryId !== undefined && { categoryId: parsed.data.categoryId }),
        ...(parsed.data.period !== undefined && { period: parsed.data.period }),
        ...(parsed.data.endDate !== undefined && { endDate: parsed.data.endDate }),
      },
      include: { category: true },
    });

    return NextResponse.json({ budget });
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
  const existing = await db.budget.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  await db.budget.delete({ where: { id } });
  return NextResponse.json({ message: "Budget deleted" });
}