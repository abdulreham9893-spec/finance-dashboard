import { LandingHeader } from "@/components/layout/landing-header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden">
      <LandingHeader />
      <main>{children}</main>
    </div>
  );
}