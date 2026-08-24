import { ShieldCheck } from "lucide-react";
import { LandingHeader } from "@/components/layout/landing-header";

const sections = [
  {
    id: "intro",
    title: "1. Introduction",
    body: [
      "This Privacy Policy explains how FinanceAI (\"we\", \"our\") collects, uses, stores, and protects your information when you use our website and services. We are committed to safeguarding your privacy and handling your financial data with the highest level of care and transparency.",
      "By creating an account or using FinanceAI, you agree to the practices described in this policy. If you do not agree, please do not use the service.",
    ],
  },
  {
    id: "collect",
    title: "2. Information we collect",
    body: [
      "Account information: your name, email address, and a securely hashed password.",
      "Financial information: the transactions, budgets, savings goals, and preferences you enter, import, or upload through the application.",
      "Usage information: basic interaction data such as pages visited and features used, collected via local storage and standard browser mechanisms, to improve the product.",
      "Device information: browser type and operating system, used for display and compatibility purposes.",
      "We do not collect any payment card numbers or connect to your bank accounts directly.",
    ],
  },
  {
    id: "use",
    title: "3. How we use your information",
    body: [
      "Your data is used to provide the features you rely on: calculating balances, generating charts and analytics, producing AI-powered insights, and creating budget recommendations.",
      "AI analysis is performed on aggregated summaries of your data — such as category totals and spending patterns — not on raw transaction lists.",
      "We use your email to keep you informed about service-related matters.",
      "We never sell, rent, or trade your personal or financial information to third parties.",
    ],
  },
  {
    id: "isolation",
    title: "4. Data isolation and security",
    body: [
      "Every account is fully isolated. You can only ever access your own transactions, budgets, goals, and insights. No other user can view your data.",
      "Passwords are hashed using industry-standard bcrypt. Session tokens are encrypted.",
      "API keys for AI providers are stored only on the server and never exposed to the browser.",
      "We follow security best practices, including input validation and server-side authorization checks on every request.",
    ],
  },
  {
    id: "storage",
    title: "5. Cookies and local storage",
    body: [
      "FinanceAI uses local storage to remember your preferences, such as the display currency and theme.",
      "We use a session cookie to keep you signed in and to secure authenticated requests.",
      "You can clear local storage and cookies at any time through your browser settings. Doing so may sign you out or reset certain preferences.",
    ],
  },
  {
    id: "thirdparty",
    title: "6. Third-party services",
    body: [
      "We may use third-party service providers to operate the platform, such as hosting and AI providers.",
      "These providers are contractually required to process your data only on our behalf and to protect it with appropriate security measures.",
      "We do not allow third parties to use your data for their own purposes.",
    ],
  },
  {
    id: "retention",
    title: "7. Data retention",
    body: [
      "We retain your data for as long as your account is active, so that you can access your financial history.",
      "If you delete your account, your data is permanently removed and cannot be recovered.",
    ],
  },
  {
    id: "rights",
    title: "8. Your rights",
    body: [
      "Access: you can view all of your data from within the application at any time.",
      "Correction: you can update your account details and financial records in-app.",
      "Export: you can export your transactions via CSV from the Import/Export tools.",
      "Deletion: you can delete your account and all associated data at any time from the Settings page. Deletion is permanent and cannot be undone.",
      "Depending on your jurisdiction, you may have additional rights under laws such as the GDPR or CCPA, including the right to object to processing or to lodge a complaint with a supervisory authority.",
    ],
  },
  {
    id: "children",
    title: "9. Children's privacy",
    body: [
      "FinanceAI is not intended for children under the age of 16, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it.",
    ],
  },
  {
    id: "transfers",
    title: "10. International data transfers",
    body: [
      "Your data is stored in the region where our infrastructure is hosted. When data is processed outside your country of residence, we take appropriate safeguards to protect it, consistent with this policy.",
    ],
  },
  {
    id: "changes",
    title: "11. Changes to this policy",
    body: [
      "We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will post any changes on this page and update the \"Last updated\" date at the top.",
      "Material changes will be communicated to you via the email address on file or a notice within the application.",
    ],
  },
  {
    id: "contact",
    title: "12. Contact",
    body: [
      "If you have any questions about this policy, wish to exercise your privacy rights, or need to report a concern, contact us at hello@financeai.app.",
      "This is a demonstration project. Data is stored in your own database and is not sold or shared with third parties for advertising or any other purpose.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <LandingHeader />

      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="space-y-3">
              <h2 className="text-xl font-semibold">{s.title}</h2>
              {s.body.map((p, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-10 border-t pt-6 text-xs text-muted-foreground">
          FinanceAI · An AI-powered financial command center. Questions? Email{" "}
          <a href="mailto:hello@financeai.app" className="text-primary hover:underline">
            hello@financeai.app
          </a>
          .
        </p>
      </main>
    </div>
  );
}