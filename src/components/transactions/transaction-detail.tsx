"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface TransactionDetail {
  id: string;
  description: string;
  amount: number;
  type: string;
  merchant: string | null;
  paymentMethod: string;
  date: string;
  notes: string | null;
  categoryId: string | null;
  category?: { name: string; icon: string; color: string } | null;
}

export function TransactionDetail({
  transaction,
  currency,
  onClose,
  onEdit,
  onDeleted,
}: {
  transaction: TransactionDetail | null;
  currency: string;
  onClose: () => void;
  onEdit: (t: TransactionDetail) => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 4000);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${transaction!.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Transaction deleted");
        onClose();
        onDeleted();
      } else {
        toast.error("Failed to delete transaction");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (!transaction) return null;

  const details: { label: string; value: string }[] = [
    { label: "Merchant", value: transaction.merchant || "—" },
    {
      label: "Payment method",
      value: transaction.paymentMethod.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    },
    { label: "Date", value: formatDate(transaction.date) },
    { label: "Category", value: transaction.category?.name ?? "Uncategorized" },
    { label: "Notes", value: transaction.notes || "—" },
  ];

  return (
    <Dialog open={Boolean(transaction)} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{transaction.description}</span>
            <span
              className={cn(
                "text-xl",
                transaction.type === "INCOME"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-foreground"
              )}
            >
              {transaction.type === "INCOME" ? "+" : "−"}
              {formatCurrency(transaction.amount, currency)}
            </span>
          </DialogTitle>
          <DialogDescription>Transaction details</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ background: `${transaction.category?.color ?? "#6b7280"}1a` }}
            >
              <span
                className="text-sm"
                style={{ color: transaction.category?.color ?? "#6b7280" }}
              >
                {transaction.category?.icon ?? "💳"}
              </span>
            </div>
            <div>
              <p className="font-medium">{transaction.category?.name ?? "Uncategorized"}</p>
              <p className="text-xs text-muted-foreground">{transaction.type}</p>
            </div>
          </div>
          {details.map((d) => (
            <div key={d.label} className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{d.label}</span>
              <span className="text-right font-medium">{d.value}</span>
            </div>
          ))}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(transaction)}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            variant={confirming ? "destructive" : "outline"}
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className={confirming ? "" : "text-destructive"}
          >
            {deleting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            )}
            {confirming ? "Confirm delete?" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}