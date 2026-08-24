"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Sparkles,
  Loader2,
  Send,
  Bot,
  RefreshCw,
  FileText,
  TrendingUp,
  Lightbulb,
  PiggyBank,
  Target,
  AlertTriangle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const TYPE_META: Record<string, { icon: typeof Sparkles; color: string; bg: string }> = {
  SPENDING_SUMMARY: { icon: TrendingUp, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10" },
  BIGGEST_CHANGE: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  SAVING_OPPORTUNITY: { icon: Lightbulb, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  POSITIVE_HABIT: { icon: PiggyBank, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  BUDGET_RECOMMENDATION: { icon: Target, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  MONTHLY_REPORT: { icon: FileText, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10" },
};

const SUGGESTIONS = [
  "Where did I spend the most this month?",
  "How much did I spend on food?",
  "Compare my spending with last month.",
  "What category increased the most?",
  "How much did I save this month?",
];

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/insights");
      const data = await res.json();
      setInsights(data.insights ?? []);
      const latestReport = (data.insights ?? []).find((i: Insight) => i.type === "MONTHLY_REPORT");
      if (latestReport) setReport(latestReport.content);
    } catch {
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const generateInsights = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/insights", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "AI insights are temporarily unavailable");
        return;
      }
      toast.success("Insights generated");
      loadInsights();
    } catch {
      toast.error("AI insights are temporarily unavailable");
    } finally {
      setGenerating(false);
    }
  };

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch("/api/insights/report", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Unable to generate report");
        return;
      }
      setReport(data.report);
      toast.success("Monthly report generated");
      loadInsights();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setReportLoading(false);
    }
  };

  const sendMessage = async (question?: string) => {
    const text = (question ?? input).trim();
    if (!text || chatLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "AI assistant is temporarily unavailable. Please try again." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Sparkles className="h-5 w-5 text-primary" /> AI Insights
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-generated analysis based on your real transaction data
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="outline" size="sm" onClick={generateReport} disabled={reportLoading}>
            {reportLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
            Monthly report
          </Button>
          <Button size="sm" onClick={generateInsights} disabled={generating}>
            {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
            Generate insights
          </Button>
        </div>
      </div>

      {report && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.05] to-transparent">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2 border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Monthly Report</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  window.location.href = "/api/insights/report/download";
                  toast.success("Downloading report…");
                }}
              >
                <Download className="h-3.5 w-3.5" /> Download .docx
              </Button>
            </div>
            <div className="whitespace-pre-line text-sm leading-relaxed">
              {report}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:space-y-0">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Insights</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="space-y-2 p-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : insights.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-8 sm:py-12 text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground/40" />
                <p className="font-medium">No insights yet</p>
                <p className="text-sm text-muted-foreground">
                  Add more transactions and generate insights to see your analysis
                </p>
              </CardContent>
            </Card>
          ) : (
            insights.map((insight) => {
              const meta = TYPE_META[insight.type] ?? TYPE_META.SPENDING_SUMMARY;
              const Icon = meta.icon;
              return (
                <Card key={insight.id}>
                  <CardContent className="flex gap-3 p-3 sm:p-4">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", meta.bg)}>
                      <Icon className={cn("h-4.5 w-4.5", meta.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{insight.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {insight.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Card className="flex flex-col lg:h-[520px]">
          <CardHeader className="border-b pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bot className="h-5 w-5 text-primary" /> Finance Assistant
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Ask questions about your finances — answered using your actual data
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-2 sm:gap-3 p-3 sm:p-4">
            <div className="flex-1 min-h-0 space-y-2 sm:space-y-3 overflow-y-auto">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-2 sm:gap-3 text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Try asking:</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        className="rounded-full border px-2.5 py-1 text-[10px] sm:text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        onClick={() => sendMessage(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[90%] rounded-2xl px-3 py-2 text-xs sm:text-sm",
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your data…
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your spending…"
                className="flex-1 min-w-0 text-sm"
              />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={chatLoading || !input.trim()} aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-center text-[10px] text-muted-foreground">
              Educational insights only — not financial advice.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}