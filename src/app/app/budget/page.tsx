"use client";

import { CircleDollarSign, TrendingDown, WalletCards } from "lucide-react";

import { useLocalStore } from "@/components/local-store";
import { MetricCard } from "@/components/metric-card";

export default function BudgetPage() {
  const { projects } = useLocalStore();
  const planned = projects.reduce((sum, project) => sum + project.budgetMinor, 0);
  const spent = projects.reduce((sum, project) => sum + project.spentMinor, 0);
  const remaining = planned - spent;

  return (
    <div>
      <header className="page-heading">
        <span className="eyebrow">Portfolio</span>
        <h1>Budget</h1>
        <p>A local preview of planned and recorded construction cost.</p>
      </header>
      <section className="metric-grid budget-metrics">
        <MetricCard label="Planned" value={(planned / 100).toLocaleString()} note="Detected currency" icon={WalletCards} tone="blue" />
        <MetricCard label="Recorded spend" value={(spent / 100).toLocaleString()} note="Across active projects" icon={CircleDollarSign} />
        <MetricCard label="Remaining" value={(remaining / 100).toLocaleString()} note="Before forecast changes" icon={TrendingDown} tone="green" />
      </section>
      <article className="content-card placeholder-card">
        <h2>Budget workspace is next</h2>
        <p>
          The shared desktop shell, derived project status, and scheduling
          surface are being established first. Budget-line editing follows in
          the next UI slice.
        </p>
      </article>
    </div>
  );
}
