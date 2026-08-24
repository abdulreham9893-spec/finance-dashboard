import { NextResponse } from "next/server";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { requireUser, unauthorized, getFullUser } from "@/lib/auth/helpers";
import { db } from "@/lib/db";

const fmt = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "D4D4D8" };
const CELL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function headerCell(text: string) {
  return new TableCell({
    borders: CELL_BORDERS,
    shading: { type: ShadingType.CLEAR, fill: "F4F4F5" },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20 })],
      }),
    ],
  });
}

function cell(text: string, opts?: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }) {
  return new TableCell({
    borders: CELL_BORDERS,
    children: [
      new Paragraph({
        alignment: opts?.align,
        children: [new TextRun({ text, size: 20, bold: opts?.bold })],
      }),
    ],
  });
}

function dataTable(headers: string[], rows: string[][], alignRightFrom = 1) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h) => headerCell(h)) }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map((c, i) =>
              cell(c, {
                bold: i === 0,
                align: i >= alignRightFrom ? AlignmentType.RIGHT : undefined,
              })
            ),
          })
      ),
    ],
  });
}

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const now = new Date();
    const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const fullUser = await getFullUser();
    const currency = fullUser?.currency || "USD";

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      include: { category: { select: { name: true } } },
    });

    const monthTx = transactions.filter((t) => new Date(t.date) >= monthStart);
    const prevTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= prevMonthStart && d <= prevMonthEnd;
    });

    const sum = (tx: typeof transactions, type: string) =>
      tx.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);

    const income = sum(monthTx, "INCOME");
    const expenses = sum(monthTx, "EXPENSE");
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const prevIncome = sum(prevTx, "INCOME");
    const prevExpenses = sum(prevTx, "EXPENSE");
    const prevSavings = prevIncome - prevExpenses;
    const txCount = monthTx.length;

    const catMap = new Map<string, number>();
    for (const t of monthTx) {
      if (t.type !== "EXPENSE") continue;
      const name = t.category?.name ?? "Uncategorized";
      catMap.set(name, (catMap.get(name) ?? 0) + t.amount);
    }
    const topCategories = Array.from(catMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    const biggestTransactions = [...monthTx]
      .filter((t) => t.type === "EXPENSE")
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)
      .map((t) => ({
        description: t.description,
        date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        amount: t.amount,
      }));

    const budgets = await db.budget.findMany({
      where: { userId: user.id, period: "MONTHLY" },
      include: { category: true },
    });
    const budgetPerformance = budgets.map((b) => {
      const spent = monthTx
        .filter((t) => t.categoryId === b.categoryId)
        .reduce((s, t) => s + t.amount, 0);
      return { name: b.category.name, budget: b.amount, spent };
    });

    const latestReport = await db.aIInsight.findFirst({
      where: { userId: user.id, type: "MONTHLY_REPORT" },
      orderBy: { createdAt: "desc" },
    });

    const change = (curr: number, prev: number) => {
      if (prev <= 0) return "—";
      const pct = Math.round(((curr - prev) / prev) * 100);
      return `${pct >= 0 ? "+" : ""}${pct}%`;
    };

    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: "Calibri", size: 22 } },
        },
      },
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
              children: [
                new TextRun({ text: "FinanceAI", bold: true, size: 28, color: "2563EB" }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
              children: [
                new TextRun({ text: `Monthly Financial Report — ${monthName}`, bold: true, size: 44 }),
              ],
            }),

            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 200 },
              children: [new TextRun({ text: "1. Summary", bold: true })],
            }),
            dataTable(
              ["Metric", "This Month", "Last Month", "Change"],
              [
                ["Income", fmt(income, currency), fmt(prevIncome, currency), change(income, prevIncome)],
                ["Expenses", fmt(expenses, currency), fmt(prevExpenses, currency), change(expenses, prevExpenses)],
                ["Net Savings", fmt(savings, currency), fmt(prevSavings, currency), change(savings, prevSavings)],
                ["Savings Rate", `${savingsRate.toFixed(1)}%`, prevIncome > 0 ? `${((prevSavings / prevIncome) * 100).toFixed(1)}%` : "—", "—"],
                ["Transactions", String(txCount), String(prevTx.length), "—"],
              ],
              1
            ),

            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
              children: [new TextRun({ text: "2. Spending by Category", bold: true })],
            }),
            topCategories.length > 0
              ? dataTable(
                  ["Category", "Amount", "% of Expenses"],
                  topCategories.map((c) => [
                    c.name,
                    fmt(c.amount, currency),
                    expenses > 0 ? `${((c.amount / expenses) * 100).toFixed(1)}%` : "—",
                  ])
                )
              : new Paragraph({ children: [new TextRun({ text: "No expenses recorded this month.", italics: true, size: 20 })] }),

            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
              children: [new TextRun({ text: "3. Budget Performance", bold: true })],
            }),
            budgetPerformance.length > 0
              ? dataTable(
                  ["Category", "Budget", "Spent", "Remaining", "Status"],
                  budgetPerformance.map((b) => {
                    const remaining = b.budget - b.spent;
                    return [
                      b.name,
                      fmt(b.budget, currency),
                      fmt(b.spent, currency),
                      fmt(remaining, currency),
                      remaining >= 0 ? "Within budget" : "Exceeded",
                    ];
                  }),
                  1
                )
              : new Paragraph({ children: [new TextRun({ text: "No budgets set for this month.", italics: true, size: 20 })] }),

            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
              children: [new TextRun({ text: "4. Largest Expenses", bold: true })],
            }),
            biggestTransactions.length > 0
              ? dataTable(
                  ["Description", "Date", "Amount"],
                  biggestTransactions.map((t) => [t.description, t.date, fmt(t.amount, currency)])
                )
              : new Paragraph({ children: [new TextRun({ text: "No expenses recorded this month.", italics: true, size: 20 })] }),

            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
              children: [new TextRun({ text: "5. AI Analysis", bold: true })],
            }),
            ...(latestReport
              ? latestReport.content
                  .split("\n")
                  .filter((line) => line.trim().length > 0)
                  .map(
                    (line) =>
                      new Paragraph({
                        spacing: { after: 120 },
                        children: [new TextRun({ text: line.trim(), size: 22 })],
                      })
                  )
              : [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Generate the AI monthly report on the Insights page to include a written analysis here.",
                        italics: true,
                        size: 20,
                        color: "71717A",
                      }),
                    ],
                  }),
                ]),

            new Paragraph({
              spacing: { before: 500 },
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Generated by FinanceAI — Educational insights only, not financial advice.",
                  size: 16,
                  color: "A1A1AA",
                }),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const fileName = `FinanceAI-Report-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate report document" }, { status: 500 });
  }
}
