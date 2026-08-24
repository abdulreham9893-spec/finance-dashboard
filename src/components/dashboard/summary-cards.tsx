"use client";

import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";

interface SummaryData {
  balance: number;
  income: number;
  expenses: number;
  savings: number;
  changes: {
    balance: number;
    income: number;
    expenses: number;
    savings: number;
  };
}

export function SummaryCards({
  data,
  currency,
  loading,
}: {
  data: SummaryData | null;
  currency: string;
  loading: boolean;
}) {
  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-2 h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Balance",
      value: data.balance,
      icon: Wallet,
      change: data.changes.balance,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Total Income",
      value: data.income,
      icon: ArrowDownToLine,
      change: data.changes.income,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Total Expenses",
      value: data.expenses,
      icon: ArrowUpFromLine,
      change: data.changes.expenses,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      title: "Savings",
      value: data.savings,
      icon: PiggyBank,
      change: data.changes.savings,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", card.bg)}>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">
              {formatCurrency(card.value, currency)}
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <ChangeIndicator change={card.change} />
              <span>vs last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChangeIndicator({ change }: { change: number }) {
  if (Math.abs(change) < 0.05) {
    return (
      <span className="inline-flex items-center gap-0.5 text-muted-foreground">
        <Minus className="h-3 w-3" /> 0.0%
      </span>
    );
  }
  const positive = change > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium",
        positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
      )}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}
      {change.toFixed(1)}%
    </span>
  );
}