"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
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
import { recurringTransactionSchema } from "@/lib/validations";
import { FREQUENCIES } from "@/lib/categories";

type RecurringFormValues = z.input<typeof recurringTransactionSchema>;

interface Category {
  id: string;
  name: string;
  type: string;
}

export function RecurringForm({
  open,
  onOpenChange,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringTransactionSchema),
    defaultValues: {
      description: "",
      amount: undefined,
      type: "EXPENSE",
      frequency: "MONTHLY",
      nextDate: new Date(),
      categoryId: null,
      active: true,
    },
  });

  const type = watch("type");

  useEffect(() => {
    if (open) {
      reset({
        description: "",
        amount: undefined,
        type: "EXPENSE",
        frequency: "MONTHLY",
        nextDate: new Date(),
        categoryId: null,
        active: true,
      });
    }
  }, [open, reset]);

  const onSubmit = async (values: RecurringFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          nextDate: new Date(values.nextDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to add recurring transaction");
        return;
      }
      toast.success("Recurring transaction added");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add recurring transaction</DialogTitle>
          <DialogDescription>
            It will be added automatically each period, e.g. monthly salary or rent.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="rdesc">Description</Label>
            <Input
              id="rdesc"
              placeholder="e.g. Netflix, Rent, Salary"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ramount">Amount</Label>
              <Input
                id="ramount"
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
              <Label htmlFor="rdate">Next occurrence</Label>
              <Input
                id="rdate"
                type="date"
                {...register("nextDate", { valueAsDate: true })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={watch("frequency")}
                onValueChange={(v) => setValue("frequency", v as RecurringFormValues["frequency"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={watch("categoryId") ?? ""}
                onValueChange={(v) => setValue("categoryId", v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {categories
                    .filter((c) => c.type === type)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add recurring
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}