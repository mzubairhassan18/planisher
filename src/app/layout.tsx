import type { Metadata } from "next";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Planisher",
    template: "%s · Planisher",
  },
  description:
    "A calm construction planning workspace for schedules, progress, and cost.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
