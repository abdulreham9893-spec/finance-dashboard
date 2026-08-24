"use client";

import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: "0.5rem",
            background: "oklch(1 0 0)",
            color: "oklch(0.129 0.042 264.695)",
            border: "1px solid oklch(0.922 0 0)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />
    </>
  );
}