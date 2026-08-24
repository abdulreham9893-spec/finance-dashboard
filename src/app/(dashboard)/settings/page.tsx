"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";
import {
  User,
  Settings2,
  Bell,
  Shield,
  RefreshCw,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Trash,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CURRENCIES, FREQUENCIES } from "@/lib/categories";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface Profile {
  id: string;
  name: string | null;
  email: string;
  currency: string;
  theme: string;
  dateFormat: string;
  language: string;
  notificationsEnabled: boolean;
  budgetAlertsEnabled: boolean;
  aiInsightsEnabled: boolean;
  monthlyReportsEnabled: boolean;
  recurringRemindersEnabled: boolean;
}

interface RecurringItem {
  id: string;
  description: string;
  amount: number;
  type: string;
  frequency: string;
  nextDate: string;
  categoryId: string | null;
  categoryName: string | null;
  active: boolean;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [theme, setTheme] = useState("system");
  const [notifPrefs, setNotifPrefs] = useState({
    notificationsEnabled: true,
    budgetAlertsEnabled: true,
    aiInsightsEnabled: true,
    monthlyReportsEnabled: true,
    recurringRemindersEnabled: true,
  });

  const [recurring, setRecurring] = useState<RecurringItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringDialog, setRecurringDialog] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringItem | null>(null);
  const [recurringForm, setRecurringForm] = useState({
    description: "",
    amount: "",
    type: "EXPENSE",
    frequency: "MONTHLY",
    nextDate: new Date().toISOString().split("T")[0],
    categoryId: "",
  });
  const [savingRecurring, setSavingRecurring] = useState(false);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profRes, recRes, catRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/recurring"),
        fetch("/api/categories"),
      ]);
      const profData = await profRes.json();
      const recData = await recRes.json();
      const catData = await catRes.json();

      if (profData.profile) {
        setProfile(profData.profile);
        setName(profData.profile.name ?? "");
        setCurrency(profData.profile.currency ?? "USD");
        setTheme(profData.profile.theme ?? "system");
        setNotifPrefs({
          notificationsEnabled: profData.profile.notificationsEnabled ?? true,
          budgetAlertsEnabled: profData.profile.budgetAlertsEnabled ?? true,
          aiInsightsEnabled: profData.profile.aiInsightsEnabled ?? true,
          monthlyReportsEnabled: profData.profile.monthlyReportsEnabled ?? true,
          recurringRemindersEnabled: profData.profile.recurringRemindersEnabled ?? true,
        });
      }
      setRecurring(recData.recurring ?? []);
      setCategories(catData.categories ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const applyThemeToUI = (t: string) => {
    const root = document.documentElement;
    if (t === "light" || t === "dark") {
      root.classList.remove("light", "dark");
      root.classList.add(t);
    } else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      root.classList.remove("light", "dark");
      root.classList.add(mq.matches ? "dark" : "light");
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currency, theme }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save profile");
        return;
      }
      localStorage.setItem("theme", theme);
      applyThemeToUI(theme);
      toast.success("Profile updated");
      load();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleNotif = async (key: keyof typeof notifPrefs, value: boolean) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: value }));
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      toast.success("Preferences updated");
    } catch {
      setNotifPrefs((prev) => ({ ...prev, [key]: !value }));
      toast.error("Failed to update preferences");
    }
  };

  const changePassword = async () => {
    if (newPw !== confirmPw) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPw.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to change password");
        return;
      }
      toast.success("Password updated");
      setCurPw("");
      setNewPw("");
      setConfirmPw("");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingPw(false);
    }
  };

  const addRecurring = async () => {
    const amount = Number(recurringForm.amount);
    if (!recurringForm.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSavingRecurring(true);
    try {
      const payload = {
        description: recurringForm.description,
        amount,
        type: recurringForm.type,
        frequency: recurringForm.frequency,
        nextDate: new Date(recurringForm.nextDate).toISOString(),
        categoryId: recurringForm.categoryId || null,
        active: editingRecurring ? editingRecurring.active : true,
      };

      const res = editingRecurring
        ? await fetch(`/api/recurring/${editingRecurring.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/recurring", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save recurring transaction");
        return;
      }
      toast.success(editingRecurring ? "Recurring transaction updated" : "Recurring transaction added");
      setRecurringDialog(false);
      setEditingRecurring(null);
      setRecurringForm({
        description: "",
        amount: "",
        type: "EXPENSE",
        frequency: "MONTHLY",
        nextDate: new Date().toISOString().split("T")[0],
        categoryId: "",
      });
      load();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingRecurring(false);
    }
  };

  const openAddRecurring = () => {
    setEditingRecurring(null);
    setRecurringForm({
      description: "",
      amount: "",
      type: "EXPENSE",
      frequency: "MONTHLY",
      nextDate: new Date().toISOString().split("T")[0],
      categoryId: "",
    });
    setRecurringDialog(true);
  };

  const openEditRecurring = (item: RecurringItem) => {
    setEditingRecurring(item);
    setRecurringForm({
      description: item.description,
      amount: String(item.amount),
      type: item.type,
      frequency: item.frequency,
      nextDate: item.nextDate.slice(0, 10),
      categoryId: item.categoryId ?? "",
    });
    setRecurringDialog(true);
  };

  const toggleRecurring = async (item: RecurringItem) => {
    await fetch(`/api/recurring/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    load();
  };

  const deleteRecurring = async (id: string) => {
    if (!confirm("Delete this recurring transaction?")) return;
    await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    toast.success("Recurring transaction deleted");
    load();
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/profile/delete-account", { method: "DELETE" });
      if (res.ok) {
        toast.success("Account deleted");
        await signOut({ redirect: false });
        router.push("/");
        router.refresh();
      } else {
        toast.error("Failed to delete account");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 rounded bg-muted animate-pulse" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-64 rounded-lg bg-muted animate-pulse" />
          <div className="h-64 rounded-lg bg-muted animate-pulse lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" /> Profile</TabsTrigger>
          <TabsTrigger value="preferences"><Settings2 className="mr-2 h-4 w-4" /> Preferences</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="recurring"><RefreshCw className="mr-2 h-4 w-4" /> Recurring</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" /> Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email ?? ""} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
              </div>
              <Button onClick={saveProfile} disabled={savingProfile}>
                {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Currency, theme and formatting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-full sm:w-72">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={theme}
                  onValueChange={(t) => {
                    setTheme(t);
                    applyThemeToUI(t);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-72">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={saveProfile} disabled={savingProfile}>
                {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose which alerts you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  { key: "notificationsEnabled", label: "Notifications", desc: "Master switch for all notifications" },
                  { key: "budgetAlertsEnabled", label: "Budget alerts", desc: "Warnings when you approach or exceed a budget" },
                  { key: "aiInsightsEnabled", label: "AI insights", desc: "Notifications when new AI analysis is ready" },
                  { key: "monthlyReportsEnabled", label: "Monthly reports", desc: "Your monthly financial summary" },
                  { key: "recurringRemindersEnabled", label: "Recurring reminders", desc: "Upcoming recurring payments" },
                ] as const
              ).map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifPrefs[item.key]}
                    onCheckedChange={(v) => toggleNotif(item.key, v)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4">
          <p className="rounded-lg border border-primary/20 bg-primary/[0.04] px-4 py-3 text-sm text-muted-foreground">
            Recurring income like your salary is deposited automatically each period —
            just update the amount here when it changes.
          </p>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recurring transactions</CardTitle>
                <CardDescription>Rent, subscriptions, salary and more</CardDescription>
              </div>
              <Button size="sm" onClick={openAddRecurring}>
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {recurring.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No recurring transactions yet. Add rent, subscriptions or salary.
                </p>
              ) : (
                <div className="space-y-2">
                  {recurring.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div className="min-w-0">
                        <p className={cn("truncate text-sm font-medium", !r.active && "text-muted-foreground line-through")}>
                          {r.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.categoryName ?? "Uncategorized"} · {r.frequency.toLowerCase()} · Next: {formatDate(r.nextDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            r.type === "INCOME"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          )}
                        >
                          {r.type === "INCOME" ? "+" : "−"}{formatCurrency(r.amount)}
                        </span>
                        <Switch checked={r.active} onCheckedChange={() => toggleRecurring(r)} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={openEditRecurring.bind(null, r)}
                          aria-label={`Edit ${r.description}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={deleteRecurring.bind(null, r.id)}
                          aria-label={`Delete ${r.description}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="curPw">Current password</Label>
                <Input id="curPw" type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPw">New password</Label>
                  <Input id="newPw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPw">Confirm new password</Label>
                  <Input id="confirmPw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                </div>
              </div>
              <Button onClick={changePassword} disabled={savingPw}>
                {savingPw && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session</CardTitle>
              <CardDescription>Sign out of your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut({ redirect: false });
                  router.push("/login");
                  router.refresh();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Danger zone</CardTitle>
              <CardDescription>Permanently delete your account and all data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash className="mr-2 h-4 w-4" /> Delete account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={recurringDialog} onOpenChange={setRecurringDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRecurring ? "Edit recurring transaction" : "Add recurring transaction"}</DialogTitle>
            <DialogDescription>Repeating income or expense</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={recurringForm.type === "EXPENSE" ? "default" : "outline"}
                  className={recurringForm.type === "EXPENSE" ? "bg-rose-500 hover:bg-rose-600" : ""}
                  onClick={() => setRecurringForm((p) => ({ ...p, type: "EXPENSE" }))}
                >
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={recurringForm.type === "INCOME" ? "default" : "outline"}
                  className={recurringForm.type === "INCOME" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                  onClick={() => setRecurringForm((p) => ({ ...p, type: "INCOME" }))}
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
                value={recurringForm.description}
                onChange={(e) => setRecurringForm((p) => ({ ...p, description: e.target.value }))}
              />
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
                  value={recurringForm.amount}
                  onChange={(e) => setRecurringForm((p) => ({ ...p, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rdate">Next occurrence</Label>
                <Input
                  id="rdate"
                  type="date"
                  value={recurringForm.nextDate}
                  onChange={(e) => setRecurringForm((p) => ({ ...p, nextDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={recurringForm.frequency}
                  onValueChange={(v) => setRecurringForm((p) => ({ ...p, frequency: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={recurringForm.categoryId}
                  onValueChange={(v) => setRecurringForm((p) => ({ ...p, categoryId: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories
                      .filter((c) => c.type === recurringForm.type)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRecurringDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addRecurring} disabled={savingRecurring}>
                {savingRecurring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingRecurring ? "Save changes" : "Add"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete account?</DialogTitle>
            <DialogDescription>
              This will permanently delete your account, transactions, budgets, goals and
              insights. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteAccount} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}