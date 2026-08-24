"use client";

import Link from "next/link";
import {
  ArrowRight,
  Wallet,
  Sparkles,
  PieChart,
  BarChart3,
  FileUp,
  TrendingUp,
  Target,
  ShieldCheck,
  Globe,
  Mail,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { LandingHeader } from "@/components/layout/landing-header";

const features = [
  {
    icon: TrendingUp,
    title: "Smart expense tracking",
    desc: "Record income and expenses in seconds with a clean, fast interface.",
  },
  {
    icon: Sparkles,
    title: "Automatic categorization",
    desc: "Transactions are categorized automatically using keyword and AI matching.",
  },
  {
    icon: Target,
    title: "AI financial insights",
    desc: "Get personalized analysis of your spending habits and saving opportunities.",
  },
  {
    icon: PieChart,
    title: "Budget monitoring",
    desc: "Set monthly budgets and get alerted when you're approaching or exceeding them.",
  },
  {
    icon: BarChart3,
    title: "Advanced analytics",
    desc: "Visualize trends, compare months and understand where your money goes.",
  },
  {
    icon: FileUp,
    title: "CSV importing",
    desc: "Import transactions from any bank with smart column mapping and validation.",
  },
];

const steps = [
  {
    num: "01",
    title: "Add or import transactions",
    desc: "Enter transactions manually or upload a CSV from your bank. Categories are suggested automatically.",
  },
  {
    num: "02",
    title: "Analyze your spending",
    desc: "Explore interactive charts, budgets and AI-generated insights based on your real data.",
  },
  {
    num: "03",
    title: "Make smarter decisions",
    desc: "Spot saving opportunities, track goals and build healthier financial habits.",
  },
];

const recentDemoTx = [
  { desc: "Grocery Store", cat: "Food", amount: -85, color: "#f97316" },
  { desc: "Salary", cat: "Income", amount: 2500, color: "#10b981" },
  { desc: "Netflix", cat: "Subscriptions", amount: -15, color: "#8b5cf6" },
  { desc: "Uber", cat: "Transportation", amount: -22, color: "#eab308" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center md:pt-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered personal finance
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Understand Your Money.
            <span className="text-primary"> Make Better Decisions.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Track your spending, manage budgets, and get AI-powered insights into your
            financial habits.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/register">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="#preview">View Demo</Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            {["Free to start", "Secure data isolation", "No credit card required"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y bg-muted/30 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to manage your money
            </h2>
            <p className="mt-4 text-muted-foreground">
              A complete financial command center for individuals.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How it works</h2>
            <p className="mt-4 text-muted-foreground">
              Three simple steps to take control of your finances.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.num} className="relative rounded-xl border p-6">
                <span className="text-4xl font-bold text-primary/20">{s.num}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section id="preview" className="border-y bg-muted/30 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              A dashboard built for clarity
            </h2>
            <p className="mt-4 text-muted-foreground">
              Your finances at a glance — balance, spending, budgets and goals.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-xl md:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Balance", value: "$8,420", change: "+12.4%", color: "text-primary" },
                { label: "Total Income", value: "$5,850", change: "+8.2%", color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Total Expenses", value: "$3,120", change: "+5.1%", color: "text-rose-600 dark:text-rose-400" },
                { label: "Savings", value: "$2,730", change: "+14.7%", color: "text-indigo-600 dark:text-indigo-400" },
              ].map((c) => (
                <div key={c.label} className="rounded-xl border bg-background p-4">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className={`mt-1 text-xl font-semibold ${c.color}`}>{c.value}</p>
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{c.change} vs last month</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border bg-background p-4">
                <p className="mb-3 text-sm font-medium">Spending overview</p>
                <div className="flex h-32 items-end gap-1">
                  {[35, 55, 40, 70, 50, 80, 60, 90, 65, 75, 55, 85].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-primary/70"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <p className="mb-3 text-sm font-medium">Recent transactions</p>
                <div className="space-y-2">
                  {recentDemoTx.map((t) => (
                    <div key={t.desc} className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                      <span className="flex-1">{t.desc}</span>
                      <span className="text-xs text-muted-foreground">{t.cat}</span>
                      <span className={`font-medium ${t.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                        {t.amount > 0 ? "+" : "−"}${Math.abs(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Take control of your finances.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join FinanceAI today and start making better financial decisions.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/register">
              Start Tracking <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wallet className="h-4 w-4" />
                </div>
                <span className="font-semibold tracking-tight">FinanceAI</span>
              </Link>
              <p className="mt-3 text-sm text-muted-foreground">
                An AI-powered financial command center for individuals.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#how" className="hover:text-foreground">How it works</Link></li>
                <li><Link href="#preview" className="hover:text-foreground">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="mailto:hello@financeai.app" className="flex items-center gap-2 hover:text-foreground">
                    <Mail className="h-3.5 w-3.5" /> Contact
                  </a>
                </li>
                <li>
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-foreground">
                    <Globe className="h-3.5 w-3.5" /> GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} FinanceAI. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Financial data is stored securely
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}