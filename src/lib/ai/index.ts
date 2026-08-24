import { llmProvider } from "./llm";
import { localProvider } from "./local";
import type {
  AiProvider,
  SpendingAnalysisData,
  SpendingInsight,
  CategorizationResult,
  BudgetAdviceData,
  BudgetAdviceResult,
  MonthlySummaryData,
  ChatData,
  AiResult,
} from "./types";

function getActiveProvider(): AiProvider {
  return process.env.AI_API_KEY ? llmProvider : localProvider;
}

export async function analyzeSpending(
  data: SpendingAnalysisData
): Promise<AiResult<SpendingInsight[]>> {
  try {
    const provider = getActiveProvider();
    const insights = await provider.analyzeSpending(data);
    return { ok: true, data: insights, source: provider.isLlm ? "ai" : "local" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "AI unavailable",
      source: "local",
    };
  }
}

export async function categorizeTransaction(
  description: string,
  type: "INCOME" | "EXPENSE"
): Promise<CategorizationResult> {
  const provider = getActiveProvider();
  return provider.categorizeTransaction(description, type);
}

export async function generateBudgetAdvice(
  data: BudgetAdviceData
): Promise<AiResult<BudgetAdviceResult>> {
  try {
    const provider = getActiveProvider();
    const result = await provider.generateBudgetAdvice(data);
    return { ok: true, data: result, source: provider.isLlm ? "ai" : "local" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "AI unavailable",
      source: "local",
    };
  }
}

export async function generateMonthlySummary(
  data: MonthlySummaryData
): Promise<AiResult<string>> {
  try {
    const provider = getActiveProvider();
    const summary = await provider.generateMonthlySummary(data);
    return { ok: true, data: summary, source: provider.isLlm ? "ai" : "local" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "AI unavailable",
      source: "local",
    };
  }
}

export async function chatWithAssistant(data: ChatData): Promise<AiResult<string>> {
  try {
    const provider = getActiveProvider();
    const answer = await provider.chat(data);
    return { ok: true, data: answer, source: provider.isLlm ? "ai" : "local" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "AI unavailable",
      source: "local",
    };
  }
}

export const isAiAvailable = () => Boolean(process.env.AI_API_KEY);

export type {
  AiProvider,
  SpendingInsight,
  CategorizationResult,
  BudgetAdviceResult,
  MonthlySummaryData,
  ChatData,
  SpendingAnalysisData,
};