"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2, Sparkles } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { transactionSchema } from "@/lib/validations";

type TransactionFormValues = z.input<typeof transactionSchema>;

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  categoryId: string | null;
  merchant: string | null;
  paymentMethod: string;
  date: string;
  notes: string | null;
}

export function TransactionForm({
  open,
  onOpenChange,
  transaction,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  onSaved: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(transaction);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as never,
    defaultValues: {
      type: "EXPENSE",
      amount: undefined,
      description: "",
      categoryId: null,
      merchant: "",
      paymentMethod: "BANK",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      isRecurring: false,
    },
  });

  const type = watch("type");
  const description = watch("description");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      if (transaction) {
        reset({
          type: transaction.type as "INCOME" | "EXPENSE",
          amount: transaction.amount,
          description: transaction.description,
          categoryId: transaction.categoryId,
          merchant: transaction.merchant ?? "",
          paymentMethod: transaction.paymentMethod as TransactionFormValues["paymentMethod"],
          date: new Date(transaction.date).toISOString().split("T")[0],
          notes: transaction.notes ?? "",
          isRecurring: false,
        });
      } else {
        reset({
          type: "EXPENSE",
          amount: undefined,
          description: "",
          categoryId: null,
          merchant: "",
          paymentMethod: "BANK",
          date: new Date().toISOString().split("T")[0],
          notes: "",
          isRecurring: false,
        });
      }
    }
  }, [open, transaction, reset]);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  const suggestCategory = async () => {
    if (!description.trim()) return;
    setSuggesting(true);
    try {
      const res = await fetch("/api/transactions/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), type }),
      });
      const data = await res.json();
      if (data.categoryId) {
        setValue("categoryId", data.categoryId);
        toast.success(`Suggested: ${data.categoryName}`, { duration: 2000 });
      }
    } catch {
      // fallback silently
    } finally {
      setSuggesting(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (open && description.trim().length >= 3 && !isEdit) {
        suggestCategory();
      }
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, type, open]);

  const onSubmit = async (values: TransactionFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/transactions/${transaction!.id}` : "/api/transactions",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            date: new Date(values.date).toISOString(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save transaction");
        return;
      }
      toast.success(isEdit ? "Transaction updated" : "Transaction added successfully");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit transaction" : "Add transaction"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this transaction."
              : "Add a new income or expense. We'll suggest a category automatically."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={type === "EXPENSE" ? "default" : "outline"}
              className={type === "EXPENSE" ? "bg-rose-500 hover:bg-rose-600" : ""}
              onClick={() => setValue("type", "EXPENSE")}
            >
              Expense
            </Button>
            <Button
              type="button"
              variant={type === "INCOME" ? "default" : "outline"}
              className={type === "INCOME" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              onClick={() => setValue("type", "INCOME")}
            >
              Income
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                {...register("date", { valueAsDate: false })}
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              {suggesting && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Categorizing…
                </span>
              )}
            </div>
            <Input
              id="description"
              placeholder="e.g. McDonald's, Netflix, Salary"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={watch("categoryId") ?? ""}
                onValueChange={(v) => setValue("categoryId", v || null)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant</Label>
              <Input
                id="merchant"
                placeholder="e.g. Uber"
                {...register("merchant")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment method</Label>
            <Select
              value={watch("paymentMethod")}
              onValueChange={(v) => setValue("paymentMethod", v as TransactionFormValues["paymentMethod"])}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK">Bank transfer</SelectItem>
                <SelectItem value="CREDIT_CARD">Credit card</SelectItem>
                <SelectItem value="DEBIT_CARD">Debit card</SelectItem>
                <SelectItem value="DIGITAL_WALLET">Digital wallet</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes"
              className="resize-none"
              {...register("notes")}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Categories are suggested automatically based on the description.
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}