"use client";

import { useEffect } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    document.body.className = "antialiased";
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="antialiased">{children}</div>
      </AuthProvider>
    </ThemeProvider>
  );
}
