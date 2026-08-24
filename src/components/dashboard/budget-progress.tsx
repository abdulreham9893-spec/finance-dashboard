"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";

interface BudgetData {
  id: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor: string;
  amount: number;
  spent: number;
  pct: number;
  status: "ok" | "warning" | "danger" | "exceeded";
}

export function BudgetProgress({
  data,
  currency,
  loading,
}: {
  data: BudgetData[] | null;
  currency: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budgets</CardTitle>
        <CardDescription>Monthly spending vs. budget</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
            <p>No budgets set yet</p>
            <Link href="/budgets" className="font-medium text-primary hover:underline">
              Create your first budget
            </Link>
          </div>
        ) : (
          data.slice(0, 4).map((b) => (
            <div key={b.id} className="space-y-1.5">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: b.categoryColor }}
                  />
                  {b.categoryName}
                </span>
                <span className="text-xs text-muted-foreground sm:text-sm">
                  {formatCurrency(b.spent, currency)} / {formatCurrency(b.amount, currency)}
                </span>
              </div>
              <Progress
                value={Math.min(b.pct, 100)}
                className={cn(
                  "h-2",
                  b.status === "exceeded" && "[&>div]:bg-rose-500",
                  b.status === "danger" && "[&>div]:bg-amber-500",
                  b.status === "warning" && "[&>div]:bg-yellow-400"
                )}
              />
              <div
                className={cn(
                  "text-xs",
                  b.status === "exceeded"
                    ? "text-rose-600 dark:text-rose-400"
                    : b.status === "danger"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                )}
              >
                {b.pct >= 100 ? "Exceeded budget" : `${b.pct}% used`}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}