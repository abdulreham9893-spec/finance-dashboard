import { db } from "@/lib/db";

export function advanceDate(d: Date, frequency: string): Date {
  const next = new Date(d);
  if (frequency === "WEEKLY") {
    next.setDate(next.getDate() + 7);
  } else if (frequency === "MONTHLY") {
    const day = next.getDate();
    next.setMonth(next.getMonth() + 1);
    if (next.getDate() < day) next.setDate(0);
  } else if (frequency === "YEARLY") {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}

export async function processDueRecurring(userId: string): Promise<number> {
  const due = await db.recurringTransaction.findMany({
    where: { userId, active: true, nextDate: { lte: new Date() } },
  });
  if (due.length === 0) return 0;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { currency: true },
  });
  const currency = user?.currency ?? "USD";
  const now = new Date();

  let created = 0;
  for (const r of due) {
    // Catch up every missed period, not just one
    let next = new Date(r.nextDate);
    while (next <= now) {
      await db.transaction.create({
        data: {
          userId,
          type: r.type,
          amount: r.amount,
          description: r.description,
          categoryId: r.categoryId,
          merchant: r.description,
          paymentMethod: "BANK",
          date: new Date(next),
          currency,
          isRecurring: true,
        },
      });
      next = advanceDate(next, r.frequency);
      created++;
    }
    await db.recurringTransaction.update({
      where: { id: r.id },
      data: { nextDate: next },
    });
  }
  return created;
}