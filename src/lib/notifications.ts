import { db } from "@/lib/db";

export type NotificationType =
  | "BUDGET_WARNING"
  | "BUDGET_EXCEEDED"
  | "AI_INSIGHT"
  | "MONTHLY_REPORT"
  | "RECURRING_REMINDER"
  | "GOAL_MILESTONE";

export async function createNotification(
  userId: string,
  data: {
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
  }
) {
  const settings = await db.user.findUnique({
    where: { id: userId },
    select: {
      notificationsEnabled: true,
      budgetAlertsEnabled: true,
      aiInsightsEnabled: true,
      monthlyReportsEnabled: true,
      recurringRemindersEnabled: true,
    },
  });

  if (!settings) return;

  const type = data.type;
  if (
    (type === "BUDGET_WARNING" || type === "BUDGET_EXCEEDED") &&
    settings.budgetAlertsEnabled === false
  ) {
    return;
  }
  if (type === "AI_INSIGHT" && settings.aiInsightsEnabled === false) return;
  if (type === "MONTHLY_REPORT" && settings.monthlyReportsEnabled === false) return;
  if (type === "RECURRING_REMINDER" && settings.recurringRemindersEnabled === false)
    return;

  return db.notification.create({
    data: {
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
    },
  });
}