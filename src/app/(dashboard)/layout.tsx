import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { processDueRecurring } from "@/lib/recurring";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session?.user.onboarded) redirect("/onboarding");
  await processDueRecurring(session.user.id);
  return <AppShell>{children}</AppShell>;
}