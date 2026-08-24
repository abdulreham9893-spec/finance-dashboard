"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryIcon } from "@/components/ui/category-icon";
import { budgetSchema } from "@/lib/validations";
import { cn, formatCurrency } from "@/lib/utils";

type BudgetForm = z.input<typeof budgetSchema>;

interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  spent: number;
  remaining: number;
  pct: number;
  status: "ok" | "warning" | "danger" | "exceeded";
  daysRemaining: number;
  transactionCount: number;
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("USD");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [recommendation, setRecommendation] = useState<{ recommendedAmount: number; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: "",
      amount: undefined,
      period: "MONTHLY",
    },
  });

  const selectedCategory = watch("categoryId");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetRes, catRes, profileRes] = await Promise.all([
        fetch("/api/budgets"),
        fetch("/api/categories?type=EXPENSE"),
        fetch("/api/profile"),
      ]);
      const budgetData = await budgetRes.json();
      const catData = await catRes.json();
      const profileData = await profileRes.json();
      setBudgets(budgetData.budgets ?? []);
      setCategories(catData.categories ?? []);
      if (profileData.profile?.currency) setCurrency(profileData.profile.currency);
    } catch {
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setRecommendation(null);
    reset({ categoryId: "", amount: undefined, period: "MONTHLY" });
    setDialogOpen(true);
  };

  const onCategoryChange = async (id: string) => {
    setValue("categoryId", id);
    setRecommendation(null);
    const existing = budgets.find((b) => b.categoryId === id);
    if (existing) {
      setValue("amount", existing.amount);
    } else {
      setRecommending(true);
      try {
        const res = await fetch("/api/budgets/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId: id }),
        });
        const data = await res.json();
        const result = data.data ?? data;
        if (result?.recommendedAmount) {
          setRecommendation({ recommendedAmount: result.recommendedAmount, message: result.message });
        }
      } catch {
        // silent
      } finally {
        setRecommending(false);
      }
    }
  };

  const onSubmit = async (values: BudgetForm) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save budget");
        return;
      }
      toast.success("Budget created successfully");
      setDialogOpen(false);
      load();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/budgets/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Budget deleted");
        setDeleteTarget(null);
        load();
      } else {
        toast.error("Failed to delete budget");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const expenseCategories = categories;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Set monthly spending limits and stay on track
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> New budget
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-lg font-medium">No budgets yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first budget to start tracking your spending
            </p>
            <Button className="mt-2" onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" /> Create your first budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {budgets.map((b) => (
            <Card key={b.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ background: `${b.categoryColor}1a` }}
                    >
                      <CategoryIcon
                        name={b.categoryIcon}
                        className="h-4 w-4"
                        style={{ color: b.categoryColor }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">{b.categoryName}</CardTitle>
                      <CardDescription>
                        {b.daysRemaining} day{b.daysRemaining === 1 ? "" : "s"} left this month
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => setDeleteTarget(b)}
                      aria-label={`Delete ${b.categoryName} budget`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-2xl font-semibold tracking-tight">
                    {formatCurrency(b.amount, currency)}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      b.status === "exceeded"
                        ? "text-rose-600 dark:text-rose-400"
                        : b.status === "danger"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                    )}
                  >
                    {formatCurrency(b.spent, currency)} spent
                  </span>
                </div>
                <Progress
                  value={Math.min(b.pct, 100)}
                  className={cn(
                    "h-2.5",
                    b.status === "exceeded" && "[&>div]:bg-rose-500",
                    b.status === "danger" && "[&>div]:bg-amber-500",
                    b.status === "warning" && "[&>div]:bg-yellow-400"
                  )}
                />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span
                    className={cn(
                      "font-medium",
                      b.status === "exceeded"
                        ? "text-rose-600 dark:text-rose-400"
                        : b.status === "danger"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                    )}
                  >
                    {b.pct >= 100
                      ? `Exceeded by ${formatCurrency(Math.abs(b.remaining), currency)}`
                      : `${b.pct}% used · ${formatCurrency(b.remaining, currency)} remaining`}
                  </span>
                  <span className="text-muted-foreground">{b.transactionCount} transactions</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create budget</DialogTitle>
            <DialogDescription>
              Set a monthly spending limit for a category.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={onCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-xs text-destructive">{errors.categoryId.message}</p>
              )}
            </div>

            {recommending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Getting AI recommendation…
              </div>
            )}

            {recommendation && (
              <div className="flex gap-2 rounded-lg border border-primary/20 bg-primary/[0.04] p-3 text-sm">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">AI recommendation</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{recommendation.message}</p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="mt-1 h-auto p-0 text-xs"
                    onClick={() => setValue("amount", recommendation.recommendedAmount)}
                  >
                    Use {formatCurrency(recommendation.recommendedAmount, currency)}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Monthly budget</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                placeholder="0.00"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              AI recommendations are suggestions based on your spending history — not
              financial advice.
            </p>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create budget
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete budget?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `This will permanently delete the ${deleteTarget.categoryName} budget of ${formatCurrency(deleteTarget.amount, currency)}. Your transactions won't be affected.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}