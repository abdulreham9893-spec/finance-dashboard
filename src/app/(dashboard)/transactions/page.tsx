"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowDownUp,
  ArrowLeftRight,
  FileUp,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionDetail } from "@/components/transactions/transaction-detail";
import { RecurringForm } from "@/components/transactions/recurring-form";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  merchant: string | null;
  paymentMethod: string;
  notes: string | null;
  categoryId: string | null;
  category?: { name: string; icon: string; color: string } | null;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");
  const addParam = searchParams.get("add");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [sort, setSort] = useState("newest");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [currency, setCurrency] = useState("USD");

  const deferredSearch = useRef<string>("");

  useEffect(() => {
    const t = setTimeout(() => {
      deferredSearch.current = debouncedSearch;
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        sort,
      });
      if (deferredSearch.current) params.set("search", deferredSearch.current);
      if (categoryFilter) params.set("category", categoryFilter);
      if (typeFilter) params.set("type", typeFilter);

      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.transactions ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
      if (!currency && data.transactions?.[0]) {
        // keep USD default; real currency from user later
      }
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort, categoryFilter, typeFilter, currency]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile?.currency) setCurrency(d.profile.currency);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (addParam === "1") {
      setFormOpen(true);
    }
  }, [addParam]);

  useEffect(() => {
    if (highlight && transactions.length > 0) {
      const t = transactions.find((x) => x.id === highlight);
      if (t) setSelected(t);
    }
  }, [highlight, transactions]);

  const handleSaved = () => {
    load();
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategoryFilter("");
    setTypeFilter("");
    setSort("newest");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
            <p className="text-sm text-muted-foreground">
              {total > 0 ? `${total} transaction${total > 1 ? "s" : ""}` : "Track your income and expenses"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/import")}>
            <FileUp className="mr-1.5 h-3.5 w-3.5" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRecurringOpen(true)}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Recurring
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add transaction
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions…"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setDebouncedSearch(e.target.value);
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-full sm:w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="EXPENSE">Expenses</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-9 flex-1 sm:w-40 sm:flex-none">
                    <ArrowDownUp className="mr-2 h-3.5 w-3.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="amount">Highest amount</SelectItem>
                    <SelectItem value="amountAsc">Lowest amount</SelectItem>
                  </SelectContent>
                </Select>
                {(search || categoryFilter || typeFilter || sort !== "newest") && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={resetFilters} aria-label="Clear filters">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Payment</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="hidden px-4 py-3 lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3 text-right"><Skeleton className="ml-auto h-4 w-16" /></td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <ArrowLeftRight className="h-8 w-8 text-muted-foreground/40" />
                        <p className="font-medium">No transactions found</p>
                        <p className="text-sm text-muted-foreground">
                          {search || categoryFilter || typeFilter
                            ? "Try adjusting your filters"
                            : "Add a transaction or import your bank CSV"}
                        </p>
                        <Button
                          className="mt-2"
                          onClick={() => { setEditing(null); setFormOpen(true); }}
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add your first transaction
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr
                      key={t.id}
                      className={cn(
                        "cursor-pointer border-b transition-colors last:border-0 hover:bg-accent/50",
                        highlight === t.id && "bg-primary/5"
                      )}
                      onClick={() => setSelected(t)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDate(t.date)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{t.description}</p>
                        {t.merchant && (
                          <p className="text-xs text-muted-foreground">{t.merchant}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            background: `${t.category?.color ?? "#6b7280"}14`,
                            color: t.category?.color ?? "#6b7280",
                          }}
                        >
                          {t.category?.name ?? "Uncategorized"}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                        {t.paymentMethod.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "font-semibold",
                            t.type === "INCOME"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          )}
                        >
                          {t.type === "INCOME" ? "+" : "−"}
                          {formatCurrency(t.amount, currency)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && transactions.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {total} transactions
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <ArrowLeftRight className="h-8 w-8 text-muted-foreground/40" />
              <p className="font-medium">No transactions found</p>
              <p className="text-sm text-muted-foreground">
                {search || categoryFilter || typeFilter
                  ? "Try adjusting your filters"
                  : "Add a transaction or import your bank CSV"}
              </p>
              <Button
                className="mt-2"
                onClick={() => { setEditing(null); setFormOpen(true); }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add your first transaction
              </Button>
            </CardContent>
          </Card>
        ) : (
          transactions.map((t) => (
            <Card
              key={t.id}
              className={cn(
                "cursor-pointer transition-colors hover:bg-accent/50",
                highlight === t.id && "ring-1 ring-primary/20"
              )}
              onClick={() => setSelected(t)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{t.description}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(t.date)}</span>
                      {t.category && (
                        <>
                          <span>·</span>
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                              background: `${t.category.color}14`,
                              color: t.category.color,
                            }}
                          >
                            {t.category.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold",
                      t.type === "INCOME"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground"
                    )}
                  >
                    {t.type === "INCOME" ? "+" : "−"}
                    {formatCurrency(t.amount, currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {!loading && transactions.length > 0 && (
          <div className="flex items-center justify-between px-1 py-2">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {total} transactions
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <RecurringForm
        open={recurringOpen}
        onOpenChange={setRecurringOpen}
        categories={categories}
        onSaved={handleSaved}
      />

      <TransactionForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        transaction={editing}
        onSaved={handleSaved}
      />

      <TransactionDetail
        transaction={selected}
        currency={currency}
        onClose={() => setSelected(null)}
        onEdit={(t) => {
          setSelected(null);
          setEditing(t);
          setFormOpen(true);
        }}
        onDeleted={handleSaved}
      />
    </div>
  );
}