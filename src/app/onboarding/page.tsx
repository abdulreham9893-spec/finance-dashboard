import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import OnboardingWizard from "./onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session?.user.onboarded) redirect("/dashboard");
  return <OnboardingWizard />;
}