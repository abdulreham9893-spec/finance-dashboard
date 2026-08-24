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
import { localProvider } from "./local";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

interface ProviderConfig {
  name: string;
  url: string;
  model: string;
}

function getProviderConfig(): ProviderConfig | null {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) return null;

  switch (provider) {
    case "anthropic":
      return {
        name: "anthropic",
        url: ANTHROPIC_URL,
        model: process.env.AI_MODEL || "claude-3-5-haiku-latest",
      };
    case "openai":
      return {
        name: "openai",
        url: OPENAI_URL,
        model: process.env.AI_MODEL || "gpt-4o-mini",
      };
    case "local":
      return null;
    default:
      return {
        name: "openai",
        url: OPENAI_URL,
        model: process.env.AI_MODEL || "gpt-4o-mini",
      };
  }
}

function buildOpenAIRequest(
  model: string,
  systemPrompt: string,
  userContent: string,
  temperature: number = 0.3
) {
  return {
    model,
    temperature,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  };
}

async function callLLM(
  systemPrompt: string,
  userContent: string,
  temperature?: number
): Promise<string> {
  const config = getProviderConfig();
  if (!config) {
    throw new Error("No AI provider configured");
  }

  const apiKey = process.env.AI_API_KEY!;

  if (config.name === "anthropic") {
    const res = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 1500,
        temperature: temperature ?? 0.3,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    if (!res.ok) {
      throw new Error(`LLM request failed: ${res.status}`);
    }
    const json = await res.json();
    return json.content?.[0]?.text ?? "";
  }

  const res = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(buildOpenAIRequest(config.model, systemPrompt, userContent, temperature)),
  });
  if (!res.ok) {
    throw new Error(`LLM request failed: ${res.status}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

function tryParseJson<T>(text: string): T | null {
  try {
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/```$/m, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

const SAFETY_SYSTEM_PROMPT =
  "You are a helpful personal finance assistant embedded in a finance app. " +
  "You must ONLY base your answers on the real transaction data provided by the user. " +
  "Never invent transactions, amounts, or financial facts that are not present in the data. " +
  "If the data does not contain an answer, say so clearly. " +
  "Provide educational insights only. Do NOT give personalized investment, tax, legal, or professional financial advice. " +
  "Use tentative language such as 'Based on your spending history...' rather than definitive commands.";

/** LLM-backed provider. Falls back to local logic if the API call fails. */
export const llmProvider: AiProvider = {
  name: "llm",
  isLlm: true,

  async analyzeSpending(data: SpendingAnalysisData): Promise<SpendingInsight[]> {
    try {
      const prompt = JSON.stringify(data, null, 2);
      const raw = await callLLM(
        SAFETY_SYSTEM_PROMPT +
          "\nAnalyze the user's spending data and return a JSON array of exactly 5 insight objects. " +
          'Each object: {"type": "SPENDING_SUMMARY"|"BIGGEST_CHANGE"|"SAVING_OPPORTUNITY"|"POSITIVE_HABIT"|"BUDGET_RECOMMENDATION", "title": string, "content": string, "icon": string, "tone": "positive"|"warning"|"neutral"|"info"}. ' +
          "Be concrete, use numbers from the data, and keep each content under 140 characters.",
        prompt,
        0.4
      );
      const parsed = tryParseJson<SpendingInsight[]>(raw);
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 5);
      }
      return await localProvider.analyzeSpending(data);
    } catch {
      return await localProvider.analyzeSpending(data);
    }
  },

  async categorizeTransaction(
    description: string,
    type: "INCOME" | "EXPENSE"
  ): Promise<CategorizationResult> {
    const local = await localProvider.categorizeTransaction(description, type);
    try {
      const prompt = JSON.stringify({ description, type });
      const raw = await callLLM(
        SAFETY_SYSTEM_PROMPT +
          "\nReturn a single category name for this transaction in JSON: {\"category\": string, \"confidence\": number between 0 and 1}.",
        prompt,
        0.1
      );
      const parsed = tryParseJson<{ category?: string; confidence?: number }>(raw);
      if (parsed?.category) {
        return {
          category: parsed.category,
          confidence: parsed.confidence ?? 0.6,
          source: "ai",
        };
      }
      return local;
    } catch {
      return local;
    }
  },

  async generateBudgetAdvice(data: BudgetAdviceData): Promise<BudgetAdviceResult> {
    const local = await localProvider.generateBudgetAdvice(data);
    try {
      const raw = await callLLM(
        SAFETY_SYSTEM_PROMPT +
          "\nRecommend a monthly budget for the given category based on historical spending. " +
          'Return JSON: {"recommendedAmount": number, "message": string}. Keep the message under 200 characters and phrase it as a suggestion.',
        JSON.stringify(data, null, 2),
        0.4
      );
      const parsed = tryParseJson<{ recommendedAmount?: number; message?: string }>(raw);
      if (parsed?.recommendedAmount && parsed?.message) {
        return { recommendedAmount: parsed.recommendedAmount, message: parsed.message };
      }
      return local;
    } catch {
      return local;
    }
  },

  async generateMonthlySummary(data: MonthlySummaryData): Promise<string> {
    try {
      const raw = await callLLM(
        SAFETY_SYSTEM_PROMPT +
          "\nWrite a friendly monthly financial summary (4-6 short sentences) using only the provided data. Mention income, expenses, savings rate, top categories, and budget performance. End with an educational note.",
        JSON.stringify(data, null, 2),
        0.5
      );
      if (raw && raw.trim().length > 50) {
        return raw.trim();
      }
      return await localProvider.generateMonthlySummary(data);
    } catch {
      return await localProvider.generateMonthlySummary(data);
    }
  },

  async chat(data: ChatData): Promise<string> {
    try {
      return await callLLM(
        SAFETY_SYSTEM_PROMPT +
          "\nAnswer the user's question about their personal finances using ONLY the provided data. Be concise (under 180 words). If the data cannot answer the question, say so.",
        `Question: ${data.question}\n\nMy data:\n${JSON.stringify(data.monthlyStats, null, 2)}`,
        0.3
      );
    } catch {
      return await localProvider.chat(data);
    }
  },
};