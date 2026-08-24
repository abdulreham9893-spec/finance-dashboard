import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { goalSchema } from "@/lib/validations";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();

  const goals = await db.goal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ goals });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = goalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const goal = await db.goal.create({
      data: {
        userId: user.id,
        name: data.name.trim(),
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount ?? 0,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        description: data.description?.trim() || null,
        icon: data.icon ?? "Target",
        color: data.color ?? "#10b981",
      },
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}