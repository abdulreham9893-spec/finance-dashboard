import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "30d";

  const now = new Date();
  let start: Date;
  let groupBy: "day" | "month";

  if (range === "7d") {
    start = new Date(now);
    start.setDate(now.getDate() - 7);
    groupBy = "day";
  } else if (range === "30d") {
    start = new Date(now);
    start.setDate(now.getDate() - 30);
    groupBy = "day";
  } else if (range === "3m") {
    start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    groupBy = "month";
  } else if (range === "6m") {
    start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    groupBy = "month";
  } else {
    start = new Date(now.getFullYear(), now.getMonth() - 12, 1);
    groupBy = "month";
  }

  const labelFormat: Intl.DateTimeFormatOptions =
    groupBy === "day"
      ? { month: "short", day: "numeric" }
      : { month: "short", year: "2-digit" };

  const toLocalDayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const transactions = await db.transaction.findMany({
    where: {
      userId: user.id,
      type: "EXPENSE",
      date: { gte: start },
    },
    select: { amount: true, date: true },
  });

  const map = new Map<string, number>();

  for (const t of transactions) {
    const d = new Date(t.date);
    let key: string;
    if (groupBy === "day") {
      key = toLocalDayKey(d);
    } else {
      key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    }
    map.set(key, (map.get(key) ?? 0) + t.amount);
  }

  const series: { label: string; total: number }[] = [];

  if (groupBy === "day") {
    for (let i = 0; i < (range === "7d" ? 7 : 30); i++) {
      const day = new Date(now);
      day.setDate(now.getDate() - (range === "7d" ? 6 : 29) + i);
      day.setHours(0, 0, 0, 0);
      const key = toLocalDayKey(day);
      series.push({
        label: day.toLocaleDateString("en-US", labelFormat),
        total: Math.round((map.get(key) ?? 0) * 100) / 100,
      });
    }
  } else {
    const months = range === "3m" ? 3 : range === "6m" ? 6 : 12;
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}`;
      series.push({
        label: monthStart.toLocaleDateString("en-US", labelFormat),
        total: Math.round((map.get(key) ?? 0) * 100) / 100,
      });
    }
  }

  const totalSpending = series.reduce((s, x) => s + x.total, 0);
  const highestDay = series.reduce(
    (max, s) => (s.total > max.total ? s : max),
    { label: "", total: 0 }
  );

  return NextResponse.json({
    series,
    stats: {
      total: Math.round(totalSpending * 100) / 100,
      averageDaily: Math.round((totalSpending / series.length) * 100) / 100,
      highestDay: highestDay.total > 0 ? highestDay : null,
    },
  });
}