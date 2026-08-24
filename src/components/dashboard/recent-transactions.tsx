"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeftRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  merchant: string | null;
  category?: { name: string; icon: string; color: string } | null;
}

export function RecentTransactions({
  data,
  currency,
  loading,
}: {
  data: Transaction[] | null;
  currency: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent transactions</CardTitle>
          <CardDescription>Your latest activity</CardDescription>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
            <p>You don&apos;t have any transactions yet</p>
            <Link href="/transactions?add=1" className="font-medium text-primary hover:underline">
              Add your first transaction
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {data.map((t) => (
              <Link
                key={t.id}
                href={`/transactions?highlight=${t.id}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${t.category?.color ?? "#6b7280"}1a` }}
                >
                  <ArrowLeftRight
                    className="h-4 w-4"
                    style={{ color: t.category?.color ?? "#6b7280" }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.description}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.category?.name ?? "Uncategorized"} · {formatDate(t.date)}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    t.type === "INCOME"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground"
                  )}
                >
                  {t.type === "INCOME" ? "+" : "−"}
                  {formatCurrency(t.amount, currency)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}