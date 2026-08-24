import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const categories = await db.category.findMany({
    where: {
      userId: user.id,
      ...(type ? { type } : {}),
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const { name, type, icon, color } = await request.json();

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
    }

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json({ error: "Invalid category type" }, { status: 400 });
    }

    const existing = await db.category.findFirst({
      where: { userId: user.id, name, type },
    });

    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }

    const category = await db.category.create({
      data: {
        userId: user.id,
        name,
        type,
        icon: icon ?? "Folder",
        color: color ?? "#6b7280",
        isDefault: false,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Category ID required" }, { status: 400 });
  }

  const category = await db.category.findFirst({
    where: { id, userId: user.id },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  await db.category.delete({ where: { id } });
  return NextResponse.json({ message: "Category deleted" });
}