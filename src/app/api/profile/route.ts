import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validations";

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      currency: true,
      theme: true,
      dateFormat: true,
      language: true,
      notificationsEnabled: true,
      budgetAlertsEnabled: true,
      aiInsightsEnabled: true,
      monthlyReportsEnabled: true,
      recurringRemindersEnabled: true,
      onboarded: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = profileSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const profile = await db.user.update({
      where: { id: user.id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.dateFormat !== undefined && { dateFormat: data.dateFormat }),
        ...(data.language !== undefined && { language: data.language }),
        ...(body.theme !== undefined && { theme: body.theme }),
        ...(body.notificationsEnabled !== undefined && {
          notificationsEnabled: body.notificationsEnabled,
        }),
        ...(body.budgetAlertsEnabled !== undefined && {
          budgetAlertsEnabled: body.budgetAlertsEnabled,
        }),
        ...(body.aiInsightsEnabled !== undefined && {
          aiInsightsEnabled: body.aiInsightsEnabled,
        }),
        ...(body.monthlyReportsEnabled !== undefined && {
          monthlyReportsEnabled: body.monthlyReportsEnabled,
        }),
        ...(body.recurringRemindersEnabled !== undefined && {
          recurringRemindersEnabled: body.recurringRemindersEnabled,
        }),
        ...(body.onboarded !== undefined && {
          onboarded: body.onboarded,
        }),
      },
    });

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        currency: profile.currency,
        theme: profile.theme,
        dateFormat: profile.dateFormat,
        language: profile.language,
      },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}