import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import {
  parseCsv,
  detectColumnMapping,
  validateImportedRow,
  type ImportedTransaction,
} from "@/lib/csv";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const { content, mapping } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "No CSV content provided" }, { status: 400 });
    }

    if (content.length > 10_000_000) {
      return NextResponse.json({ error: "File is too large (max 10MB)" }, { status: 400 });
    }

    const { rows, errors: parseErrors, columns } = parseCsv(content);

    if (parseErrors.length > 0) {
      return NextResponse.json(
        { error: "Could not parse CSV", errors: parseErrors },
        { status: 400 }
      );
    }

    const finalMapping = mapping ?? detectColumnMapping(columns);

    if (!finalMapping.amount && !finalMapping.date && !finalMapping.description) {
      return NextResponse.json(
        {
          error: "Unable to detect required columns",
          columns,
          detectedMapping: detectColumnMapping(columns),
        },
        { status: 422 }
      );
    }

    const validated: ImportedTransaction[] = rows.map((row) =>
      validateImportedRow(row.data, finalMapping, row.rowNumber)
    );

    const valid = validated.filter((t) => t.errors.length === 0);
    const invalid = validated.filter((t) => t.errors.length > 0);

    const duplicateKeys = new Set<number>();
    const existingTransactions = await db.transaction.findMany({
      where: { userId: user.id },
      select: { description: true, amount: true, date: true },
    });
    const existingKeys = new Set(
      existingTransactions.map(
        (t) => `${t.description.trim().toLowerCase()}|${t.amount}|${new Date(t.date).toISOString().split("T")[0]}`
      )
    );

    const deduped: ImportedTransaction[] = [];
    for (const t of valid) {
      const key = `${t.description.trim().toLowerCase()}|${t.amount}|${t.date.slice(0, 10)}`;
      if (existingKeys.has(key)) {
        duplicateKeys.add(t.rowNumber);
        t.errors.push("Duplicate transaction");
        invalid.push(t);
      } else {
        existingKeys.add(key);
        deduped.push(t);
      }
    }

    const categories = await db.category.findMany({ where: { userId: user.id } });
    const categoryMap = new Map<string, string>();
    for (const cat of categories) {
      categoryMap.set(`${cat.name.toLowerCase()}|${cat.type}`, cat.id);
    }

    let imported = 0;
    for (const t of deduped) {
      const catKey = `${(t.category ?? "").toLowerCase()}|${t.type}`;
      let categoryId = categoryMap.get(catKey) ?? null;

      if (!categoryId && t.category) {
        const created = await db.category.create({
          data: {
            userId: user.id,
            name: t.category,
            type: t.type,
            isDefault: false,
          },
        });
        categoryMap.set(catKey, created.id);
        categoryId = created.id;
      }

      await db.transaction.create({
        data: {
          userId: user.id,
          type: t.type,
          amount: t.amount,
          description: t.description || `Imported transaction`,
          categoryId,
          merchant: t.merchant || null,
          paymentMethod: t.paymentMethod,
          date: new Date(t.date),
          currency: "USD",
        },
      });
      imported++;
    }

    return NextResponse.json({
      message: `${imported} transactions imported successfully`,
      imported,
      invalid,
      duplicateRows: Array.from(duplicateKeys),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to import transactions" },
      { status: 500 }
    );
  }
}