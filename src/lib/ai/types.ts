export interface AiProvider {
  name: string;
  /** Whether a real LLM is being used (vs local rule-based). */
  isLlm: boolean;
  analyzeSpending(data: SpendingAnalysisData): Promise<SpendingInsight[]>;
  categorizeTransaction(
    description: string,
    type: "INCOME" | "EXPENSE"
  ): Promise<CategorizationResult>;
  generateBudgetAdvice(data: BudgetAdviceData): Promise<BudgetAdviceResult>;
  generateMonthlySummary(data: MonthlySummaryData): Promise<string>;
  chat(data: ChatData): Promise<string>;
}

export interface SpendingAnalysisData {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
  previousIncome: number;
  previousExpenses: number;
  categories: { name: string; amount: number; changePct: number }[];
  month: string;
  previousMonth: string;
  topExpenses: { description: string; amount: number }[];
  transactionCount: number;
  subscriptions: { description: string; amount: number }[];
  averageDailySpending: number;
  previousSavings?: number;
}

export interface SpendingInsight {
  type:
    | "SPENDING_SUMMARY"
    | "BIGGEST_CHANGE"
    | "SAVING_OPPORTUNITY"
    | "POSITIVE_HABIT"
    | "BUDGET_RECOMMENDATION";
  title: string;
  content: string;
  icon: string;
  tone: "positive" | "warning" | "neutral" | "info";
}

export interface CategorizationResult {
  category: string;
  confidence: number;
  source: "ai" | "keyword";
}

export interface BudgetAdviceData {
  category: string;
  historical: { month: string; amount: number }[];
  currentBudget: number | null;
}

export interface BudgetAdviceResult {
  recommendedAmount: number;
  message: string;
}

export interface MonthlySummaryData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  topCategories: { name: string; amount: number }[];
  biggestTransactions: { description: string; amount: number }[];
  budgetPerformance: { name: string; budget: number; spent: number }[];
  changes: string[];
  positives: string[];
  improvements: string[];
  previousIncome: number;
  previousExpenses: number;
  previousSavings: number;
}

export interface ChatData {
  question: string;
  monthlyStats: {
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
    topCategories: { name: string; amount: number }[];
    largestExpenses: { description: string; amount: number }[];
    subscriptions: { description: string; amount: number }[];
    monthlyTrend: { month: string; income: number; expenses: number; savings: number }[];
    previousExpenses: number;
    averageDailySpending: number;
    transactionCount: number;
  };
}

export interface AiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  source: "ai" | "local";
}