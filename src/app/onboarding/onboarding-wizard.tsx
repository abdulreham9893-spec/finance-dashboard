"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Wallet,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Sparkles,
  PiggyBank,
  PieChart,
  Target,
  ArrowLeftRight,
  FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CURRENCIES } from "@/lib/categories";
import { cn, formatCurrency } from "@/lib/utils";

const GOAL_OPTIONS = [
  { value: "save", label: "Save money", icon: PiggyBank },
  { value: "spending", label: "Control spending", icon: PieChart },
  { value: "track", label: "Track expenses", icon: ArrowLeftRight },
  { value: "budgets", label: "Manage budgets", icon: Target },
];

const FIRST_BUDGETS = [
  { category: "Food", amount: 400 },
  { category: "Transportation", amount: 250 },
  { category: "Entertainment", amount: 150 },
  { category: "Shopping", amount: 200 },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState("USD");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [budgetAmounts, setBudgetAmounts] = useState<Record<string, string>>(
    Object.fromEntries(FIRST_BUDGETS.map((b) => [b.category, String(b.amount)]))
  );
  const [transactionType, setTransactionType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [txDescription, setTxDescription] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const saveAndNext = async () => {
    setSaving(true);
    try {
      if (step === 2) {
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currency }),
        });
        localStorage.setItem("theme", "system");
      } else if (step === 4) {
        const catRes = await fetch(`/api/categories?type=EXPENSE`);
        const catData = await catRes.json();
        let created = 0;
        for (const [name, raw] of Object.entries(budgetAmounts)) {
          const amount = Number(String(raw).replace(/,/g, ""));
          if (!amount || amount <= 0) continue;
          const cat = catData.categories.find(
            (c: { name: string }) => c.name === name
          );
          if (!cat) continue;
          const budgetRes = await fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              categoryId: cat.id,
              amount,
              period: "MONTHLY",
            }),
          });
          if (!budgetRes.ok) {
            const err = await budgetRes.json().catch(() => ({}));
            toast.error(err.error ?? `Failed to save ${name} budget`);
          } else {
            created++;
          }
        }
        if (created === 0) {
          toast.error("Enter a budget amount for at least one category");
          setSaving(false);
          return;
        }
      } else if (step === 5) {
        const amount = Number(txAmount);
        if (!txDescription.trim() || !amount || amount <= 0) {
          toast.error("Enter a description and amount");
          return;
        }
        await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: transactionType,
            amount,
            description: txDescription.trim(),
            categoryId: null,
            date: new Date().toISOString().split("T")[0],
            paymentMethod: "BANK",
          }),
        });
      }
      if (step < 5) {
        setStep((s) => s + 1);
      } else {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onboarded: true }),
        });
        if (!res.ok) {
          toast.error("Failed to finalize onboarding");
          return;
        }
        window.location.href = "/dashboard";
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const toggleGoal = (value: string) => {
    setSelectedGoals((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value]
    );
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Wallet className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold tracking-tight">FinanceAI</p>
      </div>

      <div className="mb-6 flex items-center justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1.5 rounded-full transition-all",
              s <= step ? "w-6 bg-primary" : "w-1.5 bg-muted"
            )}
          />
        ))}
      </div>

      <Card>
        <CardHeader className="text-center">
          {step === 1 && (
            <>
              <Sparkles className="mx-auto mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">Welcome to FinanceAI</CardTitle>
              <CardDescription>
                Let&apos;s get your finances set up in under a minute.
              </CardDescription>
            </>
          )}
          {step === 2 && (
            <>
              <CardTitle className="text-2xl">Select your currency</CardTitle>
              <CardDescription>This will be used to display all amounts.</CardDescription>
            </>
          )}
          {step === 3 && (
            <>
              <CardTitle className="text-2xl">What do you want to achieve?</CardTitle>
              <CardDescription>Choose one or more goals. You can change later.</CardDescription>
            </>
          )}
          {step === 4 && (
            <>
              <CardTitle className="text-2xl">Create your budgets</CardTitle>
              <CardDescription>Set a monthly limit for each category.</CardDescription>
            </>
          )}
          {step === 5 && (
            <>
              <CardTitle className="text-2xl">Add your first transaction</CardTitle>
              <CardDescription>Or skip and import a CSV from your bank.</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {step === 2 && (
            <div className="grid grid-cols-2 gap-2">
              {CURRENCIES.slice(0, 10).map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCurrency(c.value)}
                  className={cn(
                    "rounded-lg border p-3 text-left text-sm transition-colors",
                    currency === c.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent"
                  )}
                >
                  <span className="block font-medium">{c.value}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {c.label.split("—")[1]?.trim()}
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-2">
              {GOAL_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => toggleGoal(g.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors",
                    selectedGoals.includes(g.value)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent"
                  )}
                >
                  <g.icon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{g.label}</span>
                  {selectedGoals.includes(g.value) && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set a monthly limit for each category. Leave a field at 0 to
                skip that budget.
              </p>
              <div className="space-y-3">
                {FIRST_BUDGETS.map((b) => {
                  const amount = Number(budgetAmounts[b.category]) || 0;
                  return (
                    <div
                      key={b.category}
                      className="rounded-lg border p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">{b.category}</span>
                        <span
                          className={cn(
                            "text-xs",
                            amount > 0
                              ? "font-semibold text-primary"
                              : "text-muted-foreground"
                          )}
                        >
                          {amount > 0
                            ? formatCurrency(amount, currency) + "/mo"
                            : "Not set"}
                        </span>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        value={budgetAmounts[b.category]}
                        onChange={(e) =>
                          setBudgetAmounts((prev) => ({
                            ...prev,
                            [b.category]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  );
                })}
              </div>
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Total monthly budget: </span>
                <span className="font-semibold">
                  {formatCurrency(
                    FIRST_BUDGETS.reduce(
                      (sum, b) => sum + (Number(budgetAmounts[b.category]) || 0),
                      0
                    ),
                    currency
                  )}
                  /mo
                </span>
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTransactionType("EXPENSE")}
                  className={cn(
                    "rounded-lg border p-3 text-sm transition-colors",
                    transactionType === "EXPENSE"
                      ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : "border-border hover:bg-accent"
                  )}
                >
                  Expense
                </button>
                <button
                  onClick={() => setTransactionType("INCOME")}
                  className={cn(
                    "rounded-lg border p-3 text-sm transition-colors",
                    transactionType === "INCOME"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border hover:bg-accent"
                  )}
                >
                  Income
                </button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="txDesc">Description</Label>
                <Input
                  id="txDesc"
                  placeholder="e.g. Grocery store"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="txAmount">Amount</Label>
                <Input
                  id="txAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            ) : (
              <span />
            )}
            {step < 5 ? (
              <Button onClick={saveAndNext} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/import")}
                >
                  <FileUp className="mr-2 h-4 w-4" /> Import CSV instead
                </Button>
                <Button onClick={saveAndNext} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Finish
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}