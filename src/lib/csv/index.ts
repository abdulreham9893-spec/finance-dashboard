import Papa from "papaparse";
import { categorizeDescription } from "@/lib/categories";

export interface CsvRow {
  rowNumber: number;
  data: Record<string, string>;
}

export interface ParsedCsvResult {
  columns: string[];
  rows: CsvRow[];
  errors: string[];
}

export interface ImportedTransaction {
  rowNumber: number;
  date: string;
  description: string;
  amount: number;
  category: string | null;
  merchant: string | null;
  type: "INCOME" | "EXPENSE";
  paymentMethod: string;
  errors: string[];
}

export function parseCsv(
  fileContent: string
): ParsedCsvResult {
  const errors: string[] = [];

  const result = Papa.parse<Record<string, string>>(fileContent, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
    transform: (value) => value?.trim() ?? "",
  });

  if (result.errors.length > 0) {
    for (const err of result.errors) {
      if (err.message && err.row !== undefined) {
        errors.push(`Row ${err.row + 1}: ${err.message}`);
      }
    }
  }

  if (!result.data || result.data.length === 0) {
    errors.push("The file is empty or contains no data rows.");
  }

  const columns = result.meta.fields ?? [];
  const rows = result.data.map((data, index) => ({
    rowNumber: index + 2,
    data,
  }));

  return { columns, rows, errors };
}

export const COMMON_ALIASES: Record<string, string[]> = {
  date: ["date", "transaction date", "posted date", "trans date", "time"],
  description: ["description", "transaction description", "memo", "payee", "name", "details", "narration", "title"],
  amount: ["amount", "transaction amount", "value", "sum", "debit", "credit"],
  category: ["category", "type", "merchant category"],
  merchant: ["merchant", "merchant name", "payee name", "vendor", "counterparty", "company"],
  type: ["type", "txn type", "transaction type", "flow", "kind"],
};

export function detectColumnMapping(
  columns: string[]
): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const column of columns) {
    const normalized = column.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(COMMON_ALIASES)) {
      if (aliases.includes(normalized) && !mapping[field]) {
        mapping[field] = column;
        break;
      }
    }
  }

  return mapping;
}

export function inferTypeFromColumn(
  amountCol: string,
  typeCol: string | undefined,
  row: Record<string, string>
): "INCOME" | "EXPENSE" {
  if (typeCol) {
    const type = row[typeCol]?.toUpperCase() ?? "";
    if (type.includes("INCOME") || type.includes("CREDIT") || type.includes("DEPOSIT") || type.includes("SALARY")) {
      return "INCOME";
    }
    if (type.includes("EXPENSE") || type.includes("DEBIT") || type.includes("WITHDRAWAL") || type.includes("PAYMENT")) {
      return "EXPENSE";
    }
  }

  const value = parseFloat(row[amountCol] ?? "");
  return value >= 0 ? "EXPENSE" : "INCOME";
}

export function parseAmountValue(value: string): number | null {
  if (!value) return null;
  const cleaned = value
    .replace(/[$€£₹₨¥,]/g, "")
    .replace(/\(([^)]*)\)/, "-$1")
    .trim();
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return null;
  return Math.abs(parsed);
}

export function validateImportedRow(
  row: Record<string, string>,
  mapping: Record<string, string>,
  rowNumber: number
): ImportedTransaction {
  const errors: string[] = [];

  const rawAmount = mapping["amount"] ? row[mapping["amount"]] : "";
  const amount = parseAmountValue(rawAmount);
  if (rawAmount === undefined || rawAmount === "") {
    errors.push("Missing amount");
  } else if (amount === null || amount === 0) {
    errors.push("Invalid amount");
  }

  const rawDate = mapping["date"] ? row[mapping["date"]] : "";
  let dateStr = "";
  if (!rawDate) {
    errors.push("Missing date");
  } else {
    const parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push("Invalid date");
    } else {
      dateStr = parsedDate.toISOString();
    }
  }

  const description = mapping["description"] ? row[mapping["description"]] : "";
  if (!description) {
    errors.push("Missing description");
  }

  const type = mapping["type"]
    ? inferTypeFromColumn(mapping["amount"], mapping["type"], row)
    : "EXPENSE";

  const categoryRaw = mapping["category"] ? row[mapping["category"]] : "";
  let category: string | null = null;
  if (categoryRaw) {
    const normalized = categoryRaw.toLowerCase();
    const match = categoryFromName(normalized);
    category = match ?? categoryRaw;
  } else {
    category = categorizeDescription(description, type);
  }

  const merchant = mapping["merchant"] ? row[mapping["merchant"]] : null;
  const paymentMethod = "BANK";

  return {
    rowNumber,
    date: dateStr,
    description,
    amount: amount ?? 0,
    category,
    merchant: merchant || null,
    type,
    paymentMethod,
    errors,
  };
}

function categoryFromName(name: string): string | null {
  const known: Record<string, string | null> = {
    salary: "Salary",
    freelance: "Freelance",
    housing: "Housing",
    rent: "Housing",
    food: "Food",
    groceries: "Food",
    restaurant: "Food",
    transportation: "Transportation",
    travel: "Transportation",
    shopping: "Shopping",
    entertainment: "Entertainment",
    health: "Health",
    medical: "Health",
    education: "Education",
    finance: "Finance",
    "bank fees": "Finance",
    other: "Other",
    uncategorized: null,
    income: null,
  };
  return known[name] ?? null;
}