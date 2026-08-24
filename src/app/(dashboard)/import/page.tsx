"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Upload,
  FileUp,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Table,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { parseCsv, detectColumnMapping } from "@/lib/csv";

interface ParsedData {
  columns: string[];
  rows: Record<string, string>[];
  detectedMapping: Record<string, string>;
  rawContent: string;
}

interface ImportError {
  rowNumber: number;
  errors: string[];
  description: string;
}

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    invalid: ImportError[];
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large (max 10MB)");
      return;
    }

    const content = await file.text();
    const result = parseCsv(content);
    if (result.errors.length > 0) {
      toast.error(result.errors[0]);
      return;
    }

    const detected = detectColumnMapping(result.columns);
    setFileName(file.name);
    setParsed({
      columns: result.columns,
      rows: result.rows.map((r) => r.data),
      detectedMapping: detected,
      rawContent: content,
    });
    setMapping(detected);
    setResult(null);
    setStep(2);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const hasRequired = mapping.date && mapping.description && mapping.amount;

  const handleImport = async () => {
    if (!parsed || !hasRequired) {
      toast.error("Map the Date, Description and Amount columns");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/csv/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: parsed.rawContent, mapping }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 422) {
          toast.error("Unable to detect required columns. Please map them manually.");
          return;
        }
        toast.error(data.error ?? "Import failed");
        return;
      }
      setResult({
        imported: data.imported,
        invalid: data.invalid ?? [],
        message: data.message,
      });
      setStep(3);
      toast.success(data.message);
    } catch {
      toast.error("Something went wrong importing the file");
    } finally {
      setImporting(false);
    }
  };

  const csvContent = parsed
    ? `Date,Description,Amount,Category,Merchant,Type\n2025-01-05,Salary,2500,,,Income\n2025-01-06,Grocery Store,85,,,Expense\n2025-01-07,Netflix,15,,,Expense\n2025-01-10,Uber Ride,22,,,Expense\n2025-01-12,Amazon,67,,,Expense`
    : "";

  const downloadSample = () => {
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Import transactions</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Upload a CSV file from your bank and we&apos;ll map, validate and import it
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1.5 overflow-x-auto sm:gap-2">
        {["Upload", "Map columns", "Done"].map((label, i) => (
          <div key={label} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                step > i + 1
                  ? "bg-emerald-500 text-white"
                  : step === i + 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {step > i + 1 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "whitespace-nowrap text-xs sm:text-sm",
                step === i + 1
                  ? "font-medium"
                  : "hidden text-muted-foreground sm:inline"
              )}
            >
              {label}
            </span>
            {i < 2 && <div className="h-px w-3 shrink-0 bg-border sm:w-8" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-12",
                dragOver ? "border-primary bg-primary/5" : "border-border"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Drag &amp; drop your CSV file</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <FileUp className="mr-2 h-4 w-4" /> Choose file
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-2 rounded-lg bg-muted/60 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">
                Don&apos;t have a file? Download a sample to try.
              </span>
              <Button variant="ghost" size="sm" onClick={downloadSample}>
                Download sample CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && parsed && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Table className="h-4 w-4" /> Map your columns
              </CardTitle>
              <CardDescription>
                {fileName} · {parsed.rows.length} rows detected. Match your file columns to our fields.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  { field: "date", label: "Date", required: true },
                  { field: "description", label: "Description", required: true },
                  { field: "amount", label: "Amount", required: true },
                  { field: "category", label: "Category", required: false },
                  { field: "merchant", label: "Merchant", required: false },
                  { field: "type", label: "Type", required: false },
                ] as const
              ).map((col) => (
                <div key={col.field} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-xs font-medium text-muted-foreground sm:w-32 sm:text-sm sm:text-foreground">
                    {col.label}
                    {col.required && <span className="text-destructive"> *</span>}
                  </span>
                  <Select
                    value={mapping[col.field] ?? ""}
                    onValueChange={(v) =>
                      setMapping((prev) => ({ ...prev, [col.field]: v }))
                    }
                  >
                    <SelectTrigger className="w-full sm:flex-1">
                      <SelectValue placeholder={col.required ? "Select column" : "Not mapped"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not mapped</SelectItem>
                      {parsed.columns.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {!hasRequired && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Date, Description and Amount are required before importing.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Preview</CardTitle>
              <CardDescription>First 5 rows of your file</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mobile: stacked cards */}
              <div className="space-y-3 md:hidden">
                {parsed.rows.slice(0, 5).map((row, i) => (
                  <div key={i} className="rounded-lg border bg-muted/30 p-3">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Row {i + 1}
                    </p>
                    <dl className="space-y-1.5">
                      {parsed.columns.slice(0, 6).map((c) => (
                        <div key={c} className="flex items-baseline justify-between gap-3">
                          <dt className="shrink-0 text-xs font-medium text-muted-foreground">{c}</dt>
                          <dd className="min-w-0 truncate text-right text-xs">{row[c] ?? "—"}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
              {/* Tablet/desktop: table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      {parsed.columns.slice(0, 6).map((c) => (
                        <th key={c} className="px-2 py-2 font-medium">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        {parsed.columns.slice(0, 6).map((c) => (
                          <td key={c} className="max-w-40 truncate px-2 py-2">{row[c] ?? ""}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleImport} disabled={!hasRequired || importing}>
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Import {parsed.rows.length} transactions
            </Button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center sm:py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold">{result.message}</h2>
            {result.invalid.length > 0 && (
              <div className="w-full max-w-md rounded-lg border border-amber-300 bg-amber-50 p-4 text-left text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <p className="mb-2 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="h-4 w-4" /> {result.invalid.length} rows couldn&apos;t be imported
                </p>
                <ul className="max-h-40 space-y-1 overflow-y-auto">
                  {result.invalid.slice(0, 10).map((row, i) => (
                    <li key={i} className="text-xs">
                      Row {row.rowNumber} ({row.description || "transaction"}): {row.errors.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setStep(1)}>
                Import another file
              </Button>
              <Button className="w-full sm:w-auto" onClick={() => router.push("/transactions")}>
                View transactions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}