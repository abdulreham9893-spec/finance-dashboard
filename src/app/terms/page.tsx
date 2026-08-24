import { LandingHeader } from "@/components/layout/landing-header";

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Acceptance of terms</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            By creating an account and using FinanceAI, you agree to these terms of
            service. If you do not agree, please do not use the application.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. The service</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            FinanceAI provides tools for tracking income and expenses, managing budgets,
            setting savings goals and generating AI-powered insights from your financial
            data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Not financial advice</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            FinanceAI is a tool for organizing and understanding your personal finances.
            AI-generated insights, budget recommendations and financial health scores are
            educational suggestions based on your own data. They do NOT constitute
            professional financial, investment, tax, or legal advice. Always consult a
            qualified professional for decisions that affect your finances.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Your responsibilities</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You are responsible for the accuracy of the data you enter or import. You
            agree not to upload files containing malicious code, attempt to access other
            users&apos; data, or misuse the service in any way.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Account termination</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You may delete your account at any time. We may suspend or terminate accounts
            that violate these terms or abuse the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Limitation of liability</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            FinanceAI is provided &quot;as is&quot; without warranties of any kind. We are
            not liable for financial losses, data loss, or damages arising from use of
            the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Contact</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Questions about these terms? Contact{" "}
            <a href="mailto:hello@financeai.app" className="text-primary hover:underline">
              hello@financeai.app
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}