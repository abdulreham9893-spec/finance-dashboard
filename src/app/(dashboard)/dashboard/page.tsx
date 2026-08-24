"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target } from "lucide-react";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { UpcomingRecurring } from "@/components/dashboard/upcoming-recurring";
import { AiInsightCard } from "@/components/dashboard/ai-insight-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface DashboardData {
  currency: string;
  summary: {
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
  };
  categories: {
    categoryId: string | null;
    categoryName: string;
    icon: string;
    color: string;
    total: number;
    count: number;
  }[];
  budgets: {
    id: string;
    categoryName: string;
    categoryColor: string;
    amount: number;
    spent: number;
    pct: number;
    status: "ok" | "warning" | "danger" | "exceeded";
  }[];
  goals: {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    progress: number;
    targetDate: string | null;
    icon: string;
    color: string;
  }[];
  recurring: {
    id: string;
    description: string;
    amount: number;
    type: string;
    frequency: string;
    nextDate: string;
    categoryName: string | null;
    categoryColor: string | null;
  }[];
  recentTransactions: {
    id: string;
    description: string;
    amount: number;
    type: string;
    date: string;
    merchant: string | null;
    category?: { name: string; icon: string; color: string } | null;
  }[];
}

interface Insight {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [dashRes, insightRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/insights"),
        ]);
        const dash = await dashRes.json();
        const ins = await insightRes.json();
        if (!cancelled) {
          setData(dash);
          setInsights(ins.insights ?? []);
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const currency = data?.currency ?? "USD";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your financial overview for this month
        </p>
      </div>

      <SummaryCards data={data?.summary ?? null} currency={currency} loading={loading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <SpendingChart currency={currency} />
        </div>
        <div className="min-w-0">
          <CategoryBreakdown data={data?.categories ?? null} currency={currency} loading={loading} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <BudgetProgress data={data?.budgets ?? null} currency={currency} loading={loading} />
        </div>
        <div className="min-w-0">
          <GoalsProgress data={data?.goals ?? null} currency={currency} loading={loading} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <RecentTransactions
            data={data?.recentTransactions ?? null}
            currency={currency}
            loading={loading}
          />
        </div>
        <div className="min-w-0 space-y-4">
          <AiInsightCard data={insights} loading={loading} />
          <UpcomingRecurring data={data?.recurring ?? null} currency={currency} loading={loading} />
        </div>
      </div>
    </div>
  );
}

function GoalsProgress({
  data,
  currency,
  loading,
}: {
  data: DashboardData["goals"] | null;
  currency: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Savings goals</CardTitle>
        <CardDescription>Track your progress</CardDescription>
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
            <p>No savings goals yet</p>
            <Link href="/goals" className="font-medium text-primary hover:underline">
              Set a savings goal
            </Link>
          </div>
        ) : (
          data.slice(0, 3).map((g) => (
            <div key={g.id} className="space-y-1.5">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                    style={{ background: `${g.color}1a` }}
                  >
                    <Target className="h-3 w-3" style={{ color: g.color }} />
                  </span>
                  {g.name}
                </span>
                <span className="text-xs text-muted-foreground sm:text-sm">
                  {formatCurrency(g.currentAmount, currency)} / {formatCurrency(g.targetAmount, currency)}
                </span>
              </div>
              <Progress value={g.progress} className="h-2" />
              <p className="text-xs text-muted-foreground">{g.progress}% complete</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}