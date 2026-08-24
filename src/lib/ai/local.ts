import type {
  AiProvider,
  SpendingAnalysisData,
  SpendingInsight,
  CategorizationResult,
  BudgetAdviceData,
  BudgetAdviceResult,
  MonthlySummaryData,
  ChatData,
} from "./types";
import { categorizeDescription } from "@/lib/categories";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmtAmount(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n: number): string {
  return `${Math.round(n)}%`;
}

/**
 * Local rule-based "AI" that computes insights directly from real user data.
 * Used when no LLM API key is configured. This is deterministic and safe.
 */
export const localProvider: AiProvider = {
  name: "local",
  isLlm: false,

  async analyzeSpending(data: SpendingAnalysisData): Promise<SpendingInsight[]> {
    const insights: SpendingInsight[] = [];

    // Spending summary
    const spendingChange =
      data.previousExpenses > 0
        ? ((data.totalExpenses - data.previousExpenses) / data.previousExpenses) * 100
        : 0;
    insights.push({
      type: "SPENDING_SUMMARY",
      title: "Spending summary",
      content:
        data.totalExpenses === 0
          ? `You had no recorded expenses in ${data.month}.`
          : `You spent ${fmtAmount(data.totalExpenses)} in ${data.month}, which is ${
              spendingChange >= 0
                ? `${fmtPct(spendingChange)} more than`
                : `${fmtPct(Math.abs(spendingChange))} less than`
            } last month.`,
      icon: "TrendingUp",
      tone: spendingChange > 5 ? "warning" : "neutral",
    });

    // Biggest change
    const biggestChange = [...data.categories].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0];
    if (biggestChange && biggestChange.changePct !== 0 && data.categories.length > 0) {
      insights.push({
        type: "BIGGEST_CHANGE",
        title: "Biggest change",
        content:
          biggestChange.changePct > 0
            ? `Your ${biggestChange.name.toLowerCase()} spending increased by ${fmtPct(
                biggestChange.changePct
              )} compared with last month.`
            : `Your ${biggestChange.name.toLowerCase()} spending decreased by ${fmtPct(
                Math.abs(biggestChange.changePct)
              )} compared with last month.`,
        icon: "TrendingUp",
        tone: biggestChange.changePct > 0 ? "warning" : "positive",
      });
    }

    // Saving opportunity
    const subscriptionTotal = data.subscriptions.reduce((s, x) => s + x.amount, 0);
    if (data.subscriptions.length > 0) {
      insights.push({
        type: "SAVING_OPPORTUNITY",
        title: "Saving opportunity",
        content: `You have ${data.subscriptions.length} recurring subscription${
          data.subscriptions.length > 1 ? "s" : ""
        } totaling ${fmtAmount(subscriptionTotal)} this month. Reviewing unused subscriptions could help you save.`,
        icon: "Lightbulb",
        tone: "info",
      });
    }

    // Positive habit
    if (data.savings >= 0) {
      insights.push({
        type: "POSITIVE_HABIT",
        title: "Positive habit",
        content: `You saved ${fmtAmount(data.savings)} this month, a ${fmtPct(data.savingsRate)} savings rate. ${
          data.previousSavings === undefined
            ? ""
            : data.savings > data.previousSavings
              ? "That's an improvement over last month."
              : "Keep building on this momentum."
        }`,
        icon: "PiggyBank",
        tone: "positive",
      });
    }

    return insights;
  },

  async categorizeTransaction(
    description: string,
    type: "INCOME" | "EXPENSE"
  ): Promise<CategorizationResult> {
    return {
      category: categorizeDescription(description, type),
      confidence: 0.7,
      source: "keyword",
    };
  },

  async generateBudgetAdvice(data: BudgetAdviceData): Promise<BudgetAdviceResult> {
    const amounts = data.historical.map((h) => h.amount);
    if (amounts.length === 0) {
      return {
        recommendedAmount: 0,
        message: `Add more transactions in ${data.category} to get a budget recommendation.`,
      };
    }
    const average = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const max = Math.max(...amounts);
    const recommended = Math.round((average * 1.1 + max * 0.2) / 10) * 10;
    const months = data.historical.map((h) => h.month).join(", ");

    return {
      recommendedAmount: recommended,
      message: `Based on your previous spending in ${data.category} (${months}), consider setting a monthly budget around ${fmtAmount(
        recommended
      )}. This is a suggestion, not financial advice.`,
    };
  },

  async generateMonthlySummary(data: MonthlySummaryData): Promise<string> {
    const parts: string[] = [];
    parts.push(`Your ${data.month} Summary`);
    parts.push("");
    parts.push(`Income: ${fmtAmount(data.income)} (${data.previousIncome > 0 ? (data.income > data.previousIncome ? "up" : "down") : ""} vs ${fmtAmount(data.previousIncome)} last month)`);
    parts.push(`Expenses: ${fmtAmount(data.expenses)} (${data.previousExpenses > 0 ? (data.expenses > data.previousExpenses ? "up" : "down") : ""} vs ${fmtAmount(data.previousExpenses)} last month)`);
    parts.push(`Savings: ${fmtAmount(data.savings)} at a ${fmtPct(data.savingsRate)} savings rate.`);
    parts.push("");
    if (data.topCategories.length > 0) {
      parts.push(
        `Top spending categories: ${data.topCategories
          .slice(0, 3)
          .map((c) => `${c.name} (${fmtAmount(c.amount)})`)
          .join(", ")}.`
      );
    }
    if (data.budgetPerformance.length > 0) {
      const within = data.budgetPerformance.filter((b) => b.spent <= b.budget).length;
      parts.push(
        `You stayed within ${within} of ${data.budgetPerformance.length} budgets.`
      );
    }
    if (data.positives.length > 0) {
      parts.push(`Highlights: ${data.positives.join(". ")}.`);
    }
    if (data.improvements.length > 0) {
      parts.push(`Areas to watch: ${data.improvements.join(". ")}.`);
    }
    parts.push("");
    parts.push("This summary is generated from your transaction history for educational purposes only.");

    return parts.join("\n");
  },

  async chat(data: ChatData): Promise<string> {
    const q = data.question.toLowerCase();
    const s = data.monthlyStats;

    if (q.includes("most") && (q.includes("spend") || q.includes("where") || q.includes("category"))) {
      if (s.topCategories.length === 0) {
        return "Based on your data, you don't have any spending yet this month. Once you add transactions, I can tell you where your money goes.";
      }
      const top = s.topCategories[0];
      return `Based on your spending history, your largest expense category this month is ${top.name} at ${fmtAmount(top.amount)}.`;
    }

    if (q.includes("food") || q.includes("grocer")) {
      const food = s.topCategories.find((c) => /food|grocer/i.test(c.name));
      if (!food) return "I don't see any Food spending recorded this month.";
      return `You've spent ${fmtAmount(food.amount)} on food this month.`;
    }

    if (q.includes("compare") || q.includes("last month") || q.includes("vs")) {
      const change = s.previousExpenses > 0 ? ((s.expenses - s.previousExpenses) / s.previousExpenses) * 100 : 0;
      return change === 0
        ? "Your spending is roughly the same as last month."
        : change > 0
          ? `You spent ${fmtPct(change)} more this month than last month (${fmtAmount(s.previousExpenses)} → ${fmtAmount(s.expenses)}).`
          : `You spent ${fmtPct(Math.abs(change))} less this month than last month (${fmtAmount(s.previousExpenses)} → ${fmtAmount(s.expenses)}).`;
    }

    if (q.includes("save") || q.includes("saving") || q.includes("saved")) {
      return `You saved ${fmtAmount(s.savings)} this month at a ${fmtPct(s.savingsRate)} savings rate.`;
    }

    if (q.includes("income")) {
      return `Your total income this month is ${fmtAmount(s.income)}.`;
    }

    if (q.includes("expense") || q.includes("spend")) {
      return `Your total expenses this month are ${fmtAmount(s.expenses)}.`;
    }

    if (q.includes("largest") || q.includes("biggest")) {
      if (s.largestExpenses.length === 0) {
        return "You don't have any large expenses recorded this month.";
      }
      const largest = s.largestExpenses[0];
      return `Your largest expense this month was ${largest.description || "a transaction"} at ${fmtAmount(largest.amount)}.`;
    }

    if (q.includes("subscription") || q.includes("recurring")) {
      if (s.subscriptions.length === 0) {
        return "I don't see any recurring subscription charges in your current data.";
      }
      return `You have ${s.subscriptions.length} recurring subscriptions totaling ${fmtAmount(
        s.subscriptions.reduce((sum, x) => sum + x.amount, 0)
      )} this month.`;
    }

    if (q.includes("trend") || q.includes("month")) {
      const trend = s.monthlyTrend.map((m) => `${m.month}: ${fmtAmount(m.expenses)}`).join(", ");
      return `Your monthly spending trend: ${trend}.`;
    }

    return (
      `I can answer questions about your finances using your real transaction data. Try asking:\n` +
      `- "Where did I spend the most this month?"\n` +
      `- "How much did I spend on food?"\n` +
      `- "Compare my spending with last month."\n` +
      `- "How much did I save this month?"`
    );
  },
};

function round(n: number): number {
  return round2(n);
}

export { round };