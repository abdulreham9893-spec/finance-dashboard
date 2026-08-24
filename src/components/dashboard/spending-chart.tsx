"use client";

import { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "1y", label: "1 year" },
];

interface SeriesPoint {
  label: string;
  total: number;
}

interface SpendingStats {
  total: number;
  averageDaily: number;
  highestDay: { label: string; total: number } | null;
}

export function SpendingChart({
  currency,
  initialRange = "30d",
}: {
  currency: string;
  initialRange?: string;
}) {
  const [range, setRange] = useState(initialRange);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [stats, setStats] = useState<SpendingStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/spending?range=${r}`);
      const data = await res.json();
      setSeries(data.series ?? []);
      setStats(data.stats ?? null);
    } catch {
      setSeries([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        <div>
          <CardTitle>Spending overview</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {stats
              ? `Total ${formatCurrency(stats.total, currency)} · Avg ${formatCurrency(
                  stats.averageDaily,
                  currency
                )}/day${
                  stats.highestDay
                    ? ` · Highest ${formatCurrency(stats.highestDay.total, currency)} on ${stats.highestDay.label}`
                    : ""
                }`
              : "Your spending over time"}
          </CardDescription>
        </div>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex w-max gap-1 rounded-lg bg-muted p-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={cn(
                  "whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  range === r.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-[220px] w-full sm:h-[280px]" />
          </div>
        ) : series.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground sm:h-[280px]">
            No spending data in this period yet
          </div>
        ) : (
          <div className="h-[220px] w-full sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="spendingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                  tickFormatter={(v: number) => formatCurrency(v, currency).replace(/\.\d{2}/, "")}
                />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value), currency),
                    "Spending",
                  ]}
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-popover)",
                    color: "var(--color-popover-foreground)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#spendingFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}