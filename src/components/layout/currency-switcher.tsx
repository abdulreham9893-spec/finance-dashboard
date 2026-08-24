"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { DollarSign, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CURRENCIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function CurrencySwitcher() {
  const router = useRouter();
  const [currency, setCurrency] = useState<string>("USD");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile?.currency) setCurrency(d.profile.currency);
      })
      .catch(() => {});
  }, []);

  const changeCurrency = async (value: string) => {
    if (value === currency || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: value }),
      });
      if (!res.ok) {
        toast.error("Failed to update currency");
        return;
      }
      setCurrency(value);
      toast.success(`Currency changed to ${value}`);
      router.refresh();
      window.location.reload();
    } catch {
      toast.error("Failed to update currency");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2.5" aria-label="Change currency">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <DollarSign className="h-4 w-4" />
          )}
          <span className="hidden text-xs font-semibold sm:inline">{currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 w-52 overflow-y-auto">
        <DropdownMenuLabel>Display currency</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CURRENCIES.map((c) => (
          <button
            key={c.value}
            onClick={() => changeCurrency(c.value)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
              c.value === currency && "text-primary"
            )}
          >
            <span>{c.label}</span>
            {c.value === currency && <Check className="h-3.5 w-3.5" />}
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
