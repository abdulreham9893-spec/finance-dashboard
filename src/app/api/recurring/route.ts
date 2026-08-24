import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { recurringTransactionSchema } from "@/lib/validations";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();

  const recurring = await db.recurringTransaction.findMany({
    where: { userId: user.id },
    include: { category: { select: { name: true, icon: true, color: true } } },
    orderBy: { nextDate: "asc" },
  });

  return NextResponse.json({ recurring });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = recurringTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const recurring = await db.recurringTransaction.create({
      data: {
        userId: user.id,
        description: data.description.trim(),
        amount: data.amount,
        type: data.type,
        frequency: data.frequency,
        nextDate: new Date(data.nextDate),
        categoryId: data.categoryId || null,
        active: data.active ?? true,
      },
      include: { category: { select: { name: true, icon: true, color: true } } },
    });

    return NextResponse.json({ recurring }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}