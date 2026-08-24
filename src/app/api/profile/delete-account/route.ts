import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";

export async function DELETE() {
  const user = await requireUser();
  if (!user) return unauthorized();

  await db.user.delete({ where: { id: user.id } });
  return NextResponse.json({ message: "Account deleted" });
}