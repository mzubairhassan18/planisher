"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Banknote,
  CircleDollarSign,
  HandCoins,
  Plus,
  Receipt,
  TrendingDown,
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

export function BudgetWorkspace({ projectId }: { projectId: string }) {
  const {
    budgetLines,
    costEntries,
    openBudgetLine,
    openCostEntry,
    projects,
  } = useLocalStore();
  const settings = useSyncExternalStore(
    subscribeToLocaleSettings,
    getLocaleSettingsSnapshot,
    getServerLocaleSettingsSnapshot,
  );
  const project = projects.find((item) => item.id === projectId);
  const [taskFilter, setTaskFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const projectBudgetLines = useMemo(
    () => budgetLines.filter((line) => line.projectId === projectId),
    [budgetLines, projectId],
  );
  const projectCostEntries = useMemo(
    () => costEntries.filter((entry) => entry.projectId === projectId),
    [costEntries, projectId],
  );
  const categories = Array.from(
    new Set(projectBudgetLines.map((line) => line.category)),
  ).sort();
  const visibleLines = projectBudgetLines.filter(
    (line) =>
      (taskFilter === "all" || line.taskId === taskFilter) &&
      (categoryFilter === "all" || line.category === categoryFilter),
  );

  if (!project) return null;

  const planned = projectBudgetLines.reduce(
    (sum, line) => sum + line.plannedMinor,
    0,
  );
  const committed = projectCostEntries
    .filter((entry) => entry.type === "commitment")
    .reduce((sum, entry) => sum + entry.amountMinor, 0);
  const actual = projectCostEntries
    .filter((entry) => entry.type === "actual")
    .reduce((sum, entry) => sum + entry.amountMinor, 0);
  const forecast = Math.max(planned, committed + actual);
  const remaining = planned - actual;
  const variance = planned - forecast;
  const unallocatedActual = projectCostEntries
    .filter((entry) => entry.type === "actual" && !entry.budgetLineId)
    .reduce((sum, entry) => sum + entry.amountMinor, 0);

  return (
    <div className="project-section-content budget-workspace">
      <section className="metric-grid budget-summary-grid">
        <MetricCard
          icon={Banknote}
          label="Planned"
          note="Budget lines"
          tone="blue"
          value={<CurrencyValue minorUnits={planned} settings={settings} />}
        />
        <MetricCard
          icon={HandCoins}
          label="Committed"
          note="Approved future cost"
          value={<CurrencyValue minorUnits={committed} settings={settings} />}
        />
        <MetricCard
          icon={Receipt}
          label="Actual"
          note="Recorded expenses"
          value={<CurrencyValue minorUnits={actual} settings={settings} />}
        />
        <MetricCard
          icon={TrendingDown}
          label="Remaining"
          note={`Forecast variance ${formatMoney(variance, settings)}`}
          tone={remaining >= 0 ? "green" : "red"}
          value={<CurrencyValue minorUnits={remaining} settings={settings} />}
        />
      </section>

      <section className="content-card budget-table-card">
        <div className="section-heading compact budget-heading">
          <div>
            <span className="eyebrow">Cost control</span>
            <h2>Budget lines and expenses</h2>
          </div>
          <div className="budget-heading-actions">
            <button
              className="secondary-button"
              onClick={() => openBudgetLine(projectId)}
              type="button"
            >
              <Plus aria-hidden="true" size={15} />
              Add budget
            </button>
            <button
              className="primary-button compact"
              onClick={() => openCostEntry(projectId)}
              type="button"
            >
              <CircleDollarSign aria-hidden="true" size={15} />
              Record cost
            </button>
          </div>
        </div>

        <div className="budget-filters">
          <label>
            <span>Task</span>
            <select
              onChange={(event) => setTaskFilter(event.target.value)}
              value={taskFilter}
            >
              <option value="all">All tasks</option>
              {project.tasks
                .filter((task) => task.type !== "summary")
                .map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
            </select>
          </label>
          <label>
            <span>Category</span>
            <select
              onChange={(event) => setCategoryFilter(event.target.value)}
              value={categoryFilter}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <span>
            Forecast <strong>{formatMoney(forecast, settings)}</strong>
          </span>
        </div>

        <div className="budget-table-wrap">
          <table className="budget-table">
            <thead>
              <tr>
                <th>Budget line</th>
                <th>Task</th>
                <th>Planned</th>
                <th>Committed</th>
                <th>Actual</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {visibleLines.map((line) => {
                const task = project.tasks.find(
                  (item) => item.id === line.taskId,
                );
                const lineEntries = projectCostEntries.filter(
                  (entry) => entry.budgetLineId === line.id,
                );
                const lineCommitted = lineEntries
                  .filter((entry) => entry.type === "commitment")
                  .reduce((sum, entry) => sum + entry.amountMinor, 0);
                const lineActual = lineEntries
                  .filter((entry) => entry.type === "actual")
                  .reduce((sum, entry) => sum + entry.amountMinor, 0);
                return (
                  <tr key={line.id}>
                    <td>
                      <span className="budget-category">{line.category}</span>
                      <strong>{line.description}</strong>
                    </td>
                    <td>{task?.title ?? "Project level"}</td>
                    <td>{formatMoney(line.plannedMinor, settings)}</td>
                    <td>{formatMoney(lineCommitted, settings)}</td>
                    <td>{formatMoney(lineActual, settings)}</td>
                    <td>
                      {formatMoney(
                        line.plannedMinor - lineActual,
                        settings,
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {unallocatedActual ? (
          <p className="unallocated-cost-note">
            {formatMoney(unallocatedActual, settings)} of actual expenses are
            not yet linked to a budget line.
          </p>
        ) : null}
      </section>
    </div>
  );
}
