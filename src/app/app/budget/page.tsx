"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  ArrowRight,
  CircleDollarSign,
  HandCoins,
  TrendingDown,
  WalletCards,
} from "lucide-react";

import { useLocalStore } from "@/components/local-store";
import { MetricCard } from "@/components/metric-card";
import { CurrencyValue } from "@/components/currency-value";
import {
  formatMoney,
  getLocaleSettingsSnapshot,
  getServerLocaleSettingsSnapshot,
  subscribeToLocaleSettings,
} from "@/lib/locale";

export default function BudgetPage() {
  const { budgetLines, costEntries, projects } = useLocalStore();
  const settings = useSyncExternalStore(
    subscribeToLocaleSettings,
    getLocaleSettingsSnapshot,
    getServerLocaleSettingsSnapshot,
  );
  const planned = budgetLines.reduce(
    (sum, line) => sum + line.plannedMinor,
    0,
  );
  const committed = costEntries
    .filter((entry) => entry.type === "commitment")
    .reduce((sum, entry) => sum + entry.amountMinor, 0);
  const actual = costEntries
    .filter((entry) => entry.type === "actual")
    .reduce((sum, entry) => sum + entry.amountMinor, 0);
  const remaining = planned - actual;

  return (
    <div>
      <header className="page-heading">
        <span className="eyebrow">Portfolio</span>
        <h1>Budget</h1>
        <p>
          Planned budgets, commitments, and actual expenses across every
          active project.
        </p>
      </header>
      <section className="metric-grid budget-summary-grid">
        <MetricCard
          label="Planned"
          value={<CurrencyValue minorUnits={planned} settings={settings} />}
          note="Across budget lines"
          icon={WalletCards}
          tone="blue"
        />
        <MetricCard
          label="Committed"
          value={<CurrencyValue minorUnits={committed} settings={settings} />}
          note="Approved future cost"
          icon={HandCoins}
        />
        <MetricCard
          label="Actual"
          value={<CurrencyValue minorUnits={actual} settings={settings} />}
          note="Recorded expenses"
          icon={CircleDollarSign}
        />
        <MetricCard
          label="Remaining"
          value={<CurrencyValue minorUnits={remaining} settings={settings} />}
          note="Planned less actual"
          icon={TrendingDown}
          tone={remaining >= 0 ? "green" : "red"}
        />
      </section>

      <section className="content-card portfolio-budget-card">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Project control</span>
            <h2>Project budgets</h2>
          </div>
        </div>
        <div className="portfolio-budget-list">
          {projects.map((project) => {
            const projectLines = budgetLines.filter(
              (line) => line.projectId === project.id,
            );
            const projectCosts = costEntries.filter(
              (entry) => entry.projectId === project.id,
            );
            const projectPlanned = projectLines.reduce(
              (sum, line) => sum + line.plannedMinor,
              0,
            );
            const projectActual = projectCosts
              .filter((entry) => entry.type === "actual")
              .reduce((sum, entry) => sum + entry.amountMinor, 0);
            const used = projectPlanned
              ? Math.min(100, Math.round((projectActual / projectPlanned) * 100))
              : 0;

            return (
              <article key={project.id}>
                <span>
                  <strong>{project.name}</strong>
                  <small>
                    {project.code} · {projectLines.length} budget lines
                  </small>
                </span>
                <span className="portfolio-budget-progress">
                  <span>
                    <i style={{ width: `${used}%` }} />
                  </span>
                  <small>{used}% spent</small>
                </span>
                <span>
                  <strong>{formatMoney(projectActual, settings)}</strong>
                  <small>of {formatMoney(projectPlanned, settings)}</small>
                </span>
                <Link href={`/app/projects/${project.id}/budget`}>
                  Manage
                  <ArrowRight aria-hidden="true" size={15} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
