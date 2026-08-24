"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Loader2,
  Target,
  Trash2,
  PiggyBank,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { goalSchema } from "@/lib/validations";
import { formatCurrency, formatDate } from "@/lib/utils";

type GoalForm = z.input<typeof goalSchema>;

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  description: string | null;
  icon: string;
  color: string;
  createdAt: string;
}

const GOAL_ICONS = [
  { value: "Target", label: "🎯" },
  { value: "PiggyBank", label: "🐷" },
  { value: "Laptop", label: "💻" },
  { value: "Plane", label: "✈️" },
  { value: "Car", label: "🚗" },
  { value: "GraduationCap", label: "🎓" },
];

const GOAL_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f97316", "#ef4444", "#06b6d4"];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("USD");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [contributeAmounts, setContributeAmounts] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      targetAmount: undefined,
      currentAmount: 0,
      targetDate: undefined,
      description: "",
      icon: "Target",
      color: "#10b981",
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [goalRes, profileRes] = await Promise.all([
        fetch("/api/goals"),
        fetch("/api/profile"),
      ]);
      const goalData = await goalRes.json();
      const profileData = await profileRes.json();
      setGoals(goalData.goals ?? []);
      if (profileData.profile?.currency) setCurrency(profileData.profile.currency);
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (values: GoalForm) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          targetDate: values.targetDate ? new Date(values.targetDate).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create goal");
        return;
      }
      toast.success("Goal created successfully");
      setDialogOpen(false);
      load();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribute = async (goal: Goal) => {
    const amount = Number(contributeAmounts[goal.id]);
    if (!amount || amount <= 0) {
      toast.error("Enter a positive amount");
      return;
    }
    setContributingId(goal.id);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to add contribution");
        return;
      }
      toast.success("Contribution added");
      setContributeAmounts((prev) => ({ ...prev, [goal.id]: "" }));
      if (data.goal.currentAmount >= goal.targetAmount) {
        toast.success(`🎉 ${goal.name} goal completed!`);
      }
      load();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setContributingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Goal deleted");
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Savings goals</h1>
          <p className="text-sm text-muted-foreground">
            Set goals and track your progress
          </p>
        </div>
        <Button
          onClick={() => {
            reset({ name: "", targetAmount: undefined, currentAmount: 0, targetDate: undefined, description: "", icon: "Target", color: "#10b981" });
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> New goal
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Target className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-lg font-medium">No goals yet</p>
            <p className="text-sm text-muted-foreground">
              Set a savings goal and track your progress
            </p>
            <Button
              className="mt-2"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Create a goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => {
            const progress = g.targetAmount > 0 ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100) : 0;
            const completed = g.currentAmount >= g.targetAmount;
            return (
              <Card key={g.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                        style={{ background: `${g.color}1a` }}
                      >
                        {GOAL_ICONS.find((i) => i.value === g.icon)?.label ?? "🎯"}
                      </div>
                      <div>
                        <CardTitle className="text-base">{g.name}</CardTitle>
                        <CardDescription>
                          {g.targetDate
                            ? `Target date: ${formatDate(g.targetDate)}`
                            : "No target date"}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={handleDelete.bind(null, g.id)}
                      aria-label={`Delete ${g.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-semibold tracking-tight">
                      {formatCurrency(g.currentAmount, currency)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {formatCurrency(g.targetAmount, currency)}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2.5" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className={completed ? "font-medium text-emerald-600 dark:text-emerald-400" : ""}>
                      {completed ? "Goal completed! 🎉" : `${progress}% funded`}
                    </span>
                    {!completed && (
                      <span>{formatCurrency(g.targetAmount - g.currentAmount, currency)} to go</span>
                    )}
                  </div>
                  {!completed && (
                    <form
                      className="flex gap-2 pt-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleContribute(g);
                      }}
                    >
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Add amount"
                        value={contributeAmounts[g.id] ?? ""}
                        onChange={(e) =>
                          setContributeAmounts((prev) => ({ ...prev, [g.id]: e.target.value }))
                        }
                      />
                      <Button type="submit" size="sm" disabled={contributingId === g.id}>
                        {contributingId === g.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PiggyBank className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New savings goal</DialogTitle>
            <DialogDescription>
              Set a target amount and track your progress toward it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal name</Label>
              <Input id="name" placeholder="e.g. Emergency fund" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target amount</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="5000"
                  {...register("targetAmount", { valueAsNumber: true })}
                />
                {errors.targetAmount && (
                  <p className="text-xs text-destructive">{errors.targetAmount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target date</Label>
                <Input id="targetDate" type="date" {...register("targetDate")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex gap-2">
                {GOAL_ICONS.map((i) => (
                  <button
                    key={i.value}
                    type="button"
                    onClick={() => setValue("icon", i.value)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition-colors ${
                      watch("icon") === i.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-accent"
                    }`}
                    aria-label={`Icon ${i.value}`}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {GOAL_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue("color", c)}
                    className="h-8 w-8 rounded-full border-2 transition-transform"
                    style={{
                      background: c,
                      borderColor: watch("color") === c ? "var(--color-ring)" : "transparent",
                    }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description"
                className="resize-none"
                {...register("description")}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create goal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}