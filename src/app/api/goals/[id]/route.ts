import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { goalSchema } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await db.goal.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = goalSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const data = parsed.data;
    const goal = await db.goal.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
        ...(data.currentAmount !== undefined && { currentAmount: data.currentAmount }),
        ...(data.targetDate !== undefined && { targetDate: data.targetDate ? new Date(data.targetDate) : null }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
      },
    });

    return NextResponse.json({ goal });
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
  const existing = await db.goal.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  await db.goal.delete({ where: { id } });
  return NextResponse.json({ message: "Goal deleted" });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await db.goal.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  try {
    const { amount } = await request.json();
    const contribution = Number(amount);

    if (!contribution || contribution <= 0) {
      return NextResponse.json(
        { error: "Contribution amount must be positive" },
        { status: 400 }
      );
    }

    const newAmount = existing.currentAmount + contribution;
    const goal = await db.goal.update({
      where: { id },
      data: { currentAmount: Math.min(newAmount, existing.targetAmount) },
    });

    if (newAmount >= existing.targetAmount) {
      await createNotification(user.id, {
        type: "GOAL_MILESTONE",
        title: `Goal completed: ${existing.name}`,
        message: `Congratulations! You've reached your ${existing.name} goal.`,
        actionUrl: "/goals",
      });
    }

    return NextResponse.json({ goal });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}