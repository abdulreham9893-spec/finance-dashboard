"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CurrencySwitcher } from "@/components/layout/currency-switcher";
import { NotificationCenter } from "@/components/layout/notification-center";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchCommand } from "@/components/layout/search-command";

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">FinanceAI</span>
        </Link>

        <div className="flex-1" />

        <div className="hidden sm:block">
          <Button
            variant="outline"
            size="sm"
            className="w-56 justify-start text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <SearchIcon />
            <span className="text-sm">Search transactions…</span>
            <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
              Ctrl K
            </kbd>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setSearchOpen(true)}
          aria-label="Search transactions"
        >
          <SearchIcon />
        </Button>

        <CurrencySwitcher />
        <NotificationCenter />
        <ThemeToggle />
        <UserMenu />
      </header>

      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-2"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}