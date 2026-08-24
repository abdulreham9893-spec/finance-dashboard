"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface CategoryData {
  categoryId: string | null;
  categoryName: string;
  icon: string;
  color: string;
  total: number;
  count: number;
}

export function CategoryBreakdown({
  data,
  currency,
  loading,
}: {
  data: CategoryData[] | null;
  currency: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense categories</CardTitle>
        <CardDescription>Where your money went this month</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="mx-auto h-40 w-40 rounded-full" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
            <p>No expense categories yet</p>
            <p>Add transactions to see your category breakdown</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="h-36 w-36 sm:h-44 sm:w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="total"
                    nameKey="categoryName"
                    innerRadius="60%"
                    outerRadius="90%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.categoryId ?? entry.categoryName} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value), currency), ""]}
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-popover)",
                      color: "var(--color-popover-foreground)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2">
              {data.slice(0, 5).map((cat) => (
                <div key={cat.categoryId ?? cat.categoryName} className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: cat.color }}
                  />
                  <span className="flex-1 truncate text-sm">{cat.categoryName}</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(cat.total, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}