"use client";

import { RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface RecurringItem {
  id: string;
  description: string;
  amount: number;
  type: string;
  frequency: string;
  nextDate: string;
  categoryName: string | null;
  categoryColor: string | null;
}

export function UpcomingRecurring({
  data,
  currency,
  loading,
}: {
  data: RecurringItem[] | null;
  currency: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming recurring</CardTitle>
        <CardDescription>Next scheduled payments</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
            <p>No recurring transactions</p>
            <p>Add subscriptions or bills to track them</p>
          </div>
        ) : (
          <div className="space-y-1">
            {data.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${r.categoryColor ?? "#6b7280"}1a` }}
                >
                  <RefreshCw
                    className="h-4 w-4"
                    style={{ color: r.categoryColor ?? "#6b7280" }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.description}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.frequency.toLowerCase()} · {formatDate(r.nextDate)}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    r.type === "INCOME"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground"
                  )}
                >
                  {r.type === "INCOME" ? "+" : "−"}
                  {formatCurrency(r.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}