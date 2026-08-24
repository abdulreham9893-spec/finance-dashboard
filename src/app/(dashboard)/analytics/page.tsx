"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  PiggyBank,
  Percent,
  CalendarDays,
  Activity,
  TrendingUp,
  TrendingDown,
  HeartPulse,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AnalyticsData {
  currency: string;
  monthlySeries: { month: string; income: number; expenses: number; savings: number }[];
  last12: { month: string; income: number; expenses: number; savings: number }[];
  monthOverMonth: { name: string; total: number; changePct: number }[];
  categorySpending: { categoryId: string | null; categoryName: string; color: string; total: number; count: number }[];
  topExpenses: { id: string; description: string; amount: number; date: string; categoryName: string }[];
  stats: {
    currentIncome: number;
    currentExpenses: number;
    currentSavings: number;
    prevIncome: number;
    prevExpenses: number;
    prevSavings: number;
    savingsRate: number;
    averageDailySpending: number;
    expenseCount: number;
    spendingFrequency: number;
    incomeChange: number;
    expenseChange: number;
    savingsChange: number;
  };
  healthScore: {
    score: number;
    components: {
      budgetAdherence: number;
      savingsRate: number;
      expenseConsistency: number;
      spendingGrowth: number;
      emergencyFundProgress: number;
    };
  };
}

const tooltipStyle = {
  borderRadius: "0.5rem",
  border: "1px solid var(--color-border)",
  background: "var(--color-popover)",
  color: "var(--color-popover-foreground)",
  fontSize: "12px",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AnalyticsSkeleton />;

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Something went wrong loading analytics.</p>
      </div>
    );
  }

  const currency = data.currency;
  const stats = data.stats;

  const statCards = [
    {
      title: "Income",
      value: stats.currentIncome,
      icon: ArrowDownToLine,
      color: "text-emerald-600 dark:text-emerald-400",
      change: stats.incomeChange,
    },
    {
      title: "Expenses",
      value: stats.currentExpenses,
      icon: ArrowUpFromLine,
      color: "text-rose-600 dark:text-rose-400",
      change: stats.expenseChange,
    },
    {
      title: "Savings",
      value: stats.currentSavings,
      icon: PiggyBank,
      color: "text-indigo-600 dark:text-indigo-400",
      change: stats.savingsChange,
    },
    {
      title: "Savings rate",
      value: stats.savingsRate,
      icon: Percent,
      color: "text-blue-600 dark:text-blue-400",
      suffix: "%",
    },
    {
      title: "Avg daily spending",
      value: stats.averageDailySpending,
      icon: CalendarDays,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Spending frequency",
      value: stats.spendingFrequency,
      icon: Activity,
      color: "text-purple-600 dark:text-purple-400",
      suffix: "%",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Detailed insights into your financial activity</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((s) => (
          <Card key={s.title}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">{s.title}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {s.suffix === "%" ? `${s.value}${s.suffix}` : formatCurrency(s.value, currency)}
                </p>
                {"change" in s && s.change !== undefined && (
                  <p className={`mt-1 flex items-center gap-1 text-xs ${s.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {s.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {s.change >= 0 ? "+" : ""}{s.change.toFixed(1)}% vs last month
                  </p>
                )}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income vs expenses</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.last12} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v: number) => formatCurrency(v, currency).replace(/\.\d{2}/, "")} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" name="Income" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Savings trend</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlySeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(239 84% 67%)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(239 84% 67%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v: number) => formatCurrency(v, currency).replace(/\.\d{2}/, "")} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="savings" stroke="hsl(239 84% 67%)" strokeWidth={2} fill="url(#savingsFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Category breakdown</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categorySpending}
                      dataKey="total"
                      nameKey="categoryName"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {data.categorySpending.map((entry, i) => (
                        <Cell key={entry.categoryId ?? i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-1.5">
                {data.categorySpending.slice(0, 5).map((c) => (
                  <div key={c.categoryId ?? c.categoryName} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="flex-1 truncate">{c.categoryName}</span>
                    <span className="font-medium">{formatCurrency(c.total, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Month-over-month</CardTitle>
            <CardDescription>Category changes vs last month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.monthOverMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground">No category data to compare yet.</p>
            ) : (
              data.monthOverMonth.slice(0, 8).map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{c.name}</span>
                  <span
                    className={`flex items-center gap-1 font-medium ${
                      c.changePct > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : c.changePct < 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {c.changePct > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : c.changePct < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : null}
                    {c.changePct > 0 ? "+" : ""}{c.changePct.toFixed(1)}%
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Largest expenses</CardTitle>
            <CardDescription>Your biggest transactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
            ) : (
              data.topExpenses.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.categoryName} · {formatDate(t.date)}
                    </p>
                  </div>
                  <span className="ml-3 font-semibold">−{formatCurrency(t.amount, currency)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <HealthScoreCard data={data.healthScore} currency={currency} />
    </div>
  );
}

function HealthScoreCard({ data, currency }: { data: AnalyticsData["healthScore"]; currency: string }) {
  const labels: { key: keyof typeof data.components; label: string }[] = [
    { key: "budgetAdherence", label: "Budget adherence" },
    { key: "savingsRate", label: "Savings rate" },
    { key: "expenseConsistency", label: "Expense consistency" },
    { key: "spendingGrowth", label: "Spending growth" },
    { key: "emergencyFundProgress", label: "Emergency fund progress" },
  ];

  const scoreColor =
    data.score >= 80 ? "text-emerald-600 dark:text-emerald-400" : data.score >= 60 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5" /> Financial health
        </CardTitle>
        <CardDescription>
          A simple overview of your financial habits — not professional financial advice.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex flex-col items-center gap-2 md:w-48">
            <div
              className="flex h-32 w-32 items-center justify-center rounded-full border-8"
              style={{
                borderColor:
                  data.score >= 80
                    ? "hsl(160 84% 39%)"
                    : data.score >= 60
                      ? "hsl(45 93% 47%)"
                      : "hsl(0 72% 51%)",
              }}
            >
              <div className="text-center">
                <p className={`text-3xl font-bold ${scoreColor}`}>{data.score}</p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Currency: {currency}</p>
          </div>
          <div className="flex-1 space-y-3">
            {labels.map((l) => (
              <div key={l.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{l.label}</span>
                  <span className="font-medium">{data.components[l.key]}</span>
                </div>
                <Progress value={data.components[l.key]} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="space-y-2 p-4"><Skeleton className="h-4 w-20" /><Skeleton className="h-8 w-28" /></CardContent></Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardContent><Skeleton className="h-72 w-full" /></CardContent></Card>
        <Card><CardContent><Skeleton className="h-72 w-full" /></CardContent></Card>
      </div>
    </div>
  );
}