import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";

import "@/app/globals.css";
import "@/app/marketing.css";
import "@/app/responsive.css";
import { NavigationProgress } from "@/components/navigation-progress";
import { PwaRegistration } from "@/components/pwa-registration";

export const metadata: Metadata = {
  title: {
    default: "Planisher",
    template: "%s · Planisher",
  },
  description:
    "A calm construction planning workspace for schedules, progress, and cost.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f3" },
    { media: "(prefers-color-scheme: dark)", color: "#16231e" },
  ],
};

const themeScript = `
  try {
    const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    const preference = standalone ? "system" : (localStorage.getItem("planisher-theme") || "system");
    const theme = preference === "system"
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themePreference = preference;
  } catch (_) {
    document.documentElement.dataset.theme = "light";
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta content="light dark" name="color-scheme" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <PwaRegistration />
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
