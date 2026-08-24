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
  const notification = await db.notification.findFirst({
    where: { id, userId: user.id },
  });

  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const updated = await db.notification.update({
    where: { id },
    data: { read: body.read ?? true },
  });

  return NextResponse.json({ notification: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const notification = await db.notification.findFirst({
    where: { id, userId: user.id },
  });

  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  await db.notification.delete({ where: { id } });
  return NextResponse.json({ message: "Notification deleted" });
}