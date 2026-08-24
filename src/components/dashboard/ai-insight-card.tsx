"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Insight {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
}

const TYPE_STYLES: Record<string, { bg: string; icon: string }> = {
  SPENDING_SUMMARY: { bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", icon: "📊" },
  BIGGEST_CHANGE: { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: "📈" },
  SAVING_OPPORTUNITY: { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: "💡" },
  POSITIVE_HABIT: { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: "🌱" },
  BUDGET_RECOMMENDATION: { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: "🎯" },
};

export function AiInsightCard({
  data,
  loading,
}: {
  data: Insight[] | null;
  loading: boolean;
}) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold">AI Insights</span>
          </div>
          <Link
            href="/insights"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add more transactions to generate meaningful insights.
          </p>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 2).map((insight) => {
              const style = TYPE_STYLES[insight.type] ?? TYPE_STYLES.SPENDING_SUMMARY;
              return (
                <div key={insight.id} className="flex gap-2.5">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs ${style.bg}`}
                  >
                    {style.icon}
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {insight.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}