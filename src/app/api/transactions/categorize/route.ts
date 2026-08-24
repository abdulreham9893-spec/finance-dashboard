import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { categorizeTransaction } from "@/lib/ai";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const { description, type } = await request.json();
    if (!description || !type) {
      return NextResponse.json(
        { error: "Description and type are required" },
        { status: 400 }
      );
    }

    const aiResult = await categorizeTransaction(description, type);
    const categoryName = aiResult.category;
    const category = await db.category.findFirst({
      where: { userId: user.id, name: categoryName, type },
    });

    return NextResponse.json({
      categoryName,
      categoryId: category?.id ?? null,
      confidence: aiResult.confidence,
      source: aiResult.source,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}