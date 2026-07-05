"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, LocateFixed, Search, SlidersHorizontal } from "lucide-react";

import { getTaskScheduleStatus } from "@/lib/progress";
import type { Project } from "@/lib/types";

type ViewMode = "day" | "week" | "month";

export function ScheduleGantt({
  project,
  today,
}: {
  project: Project;
  today: Date;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const visibleTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return project.tasks;

    const matchingIds = new Set(
      project.tasks
        .filter((task) => task.title.toLowerCase().includes(normalizedQuery))
        .map((task) => task.id),
    );

    project.tasks.forEach((task) => {
      if (task.parentId && matchingIds.has(task.id)) {
        matchingIds.add(task.parentId);
      }
    });

    return project.tasks.filter((task) => matchingIds.has(task.id));
  }, [project.tasks, query]);

  useEffect(() => {
    let disposed = false;
    let ganttInstance:
      | (typeof import("dhtmlx-gantt"))["gantt"]
      | undefined;

    async function renderGantt() {
      const ganttModule = await import("dhtmlx-gantt");
      if (disposed || !containerRef.current) return;

      const { gantt } = ganttModule;
      ganttInstance = gantt;
      gantt.clearAll();

      gantt.config.date_format = "%Y-%m-%d";
      gantt.config.readonly = false;
      gantt.config.row_height = 44;
      gantt.config.bar_height = 20;
      gantt.config.grid_width = 430;
      gantt.config.min_column_width = 44;
      gantt.config.open_tree_initially = true;
      gantt.config.drag_links = true;
      gantt.config.drag_progress = true;
      gantt.config.show_progress = true;
      gantt.config.columns = [
        {
          name: "text",
          label: "Task",
          tree: true,
          width: 220,
          resize: true,
        },
        {
          name: "start_date",
          label: "Start",
          align: "center",
          width: 84,
        },
        {
          name: "duration",
          label: "Days",
          align: "center",
          width: 56,
        },
        {
          name: "progress",
          label: "%",
          align: "center",
          width: 52,
          template: (task) => `${Math.round((task.progress ?? 0) * 100)}%`,
        },
      ];

      if (viewMode === "day") {
        gantt.config.scale_unit = "day";
        gantt.config.date_scale = "%D, %d";
        gantt.config.subscales = [{ unit: "hour", step: 12, date: "%H" }];
      } else if (viewMode === "month") {
        gantt.config.scale_unit = "month";
        gantt.config.date_scale = "%F %Y";
        gantt.config.subscales = [{ unit: "week", step: 1, date: "W%W" }];
      } else {
        gantt.config.scale_unit = "week";
        gantt.config.date_scale = "%d %M";
        gantt.config.subscales = [{ unit: "day", step: 1, date: "%D" }];
      }

      gantt.templates.task_class = (_start, _end, ganttTask) => {
        const status = (
          ganttTask as typeof ganttTask & { scheduleStatus?: string }
        ).scheduleStatus;
        return status ? `gantt-status-${status}` : "";
      };

      gantt.templates.progress_text = (_start, _end, ganttTask) =>
        `${Math.round((ganttTask.progress ?? 0) * 100)}%`;

      gantt.init(containerRef.current);
      gantt.parse({
        data: visibleTasks.map((task) => ({
          id: task.id,
          parent: task.parentId ?? 0,
          text: task.title,
          start_date: task.startDate,
          end_date: task.endDate,
          progress: task.progress / 100,
          open: true,
          type:
            task.type === "summary"
              ? "project"
              : task.type === "milestone"
                ? "milestone"
                : "task",
          scheduleStatus: getTaskScheduleStatus(task, today),
        })),
        links: project.dependencies
          .filter(
            (link) =>
              visibleTasks.some((task) => task.id === link.sourceTaskId) &&
              visibleTasks.some((task) => task.id === link.targetTaskId),
          )
          .map((link) => ({
            id: link.id,
            source: link.sourceTaskId,
            target: link.targetTaskId,
            type: "0",
          })),
      });

      gantt.showDate(today);
      setLoading(false);
    }

    void renderGantt();

    return () => {
      disposed = true;
      ganttInstance?.clearAll();
    };
  }, [project.dependencies, today, viewMode, visibleTasks]);

  return (
    <section className="schedule-panel" aria-label="Project schedule">
      <div className="schedule-toolbar">
        <label className="schedule-search">
          <Search aria-hidden="true" size={16} />
          <span className="sr-only">Search tasks</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a task…"
          />
        </label>

        <button className="toolbar-button" type="button">
          <SlidersHorizontal aria-hidden="true" size={16} />
          Filter
        </button>

        <div className="view-switcher" aria-label="Timeline scale">
          {(["day", "week", "month"] as const).map((mode) => (
            <button
              className={mode === viewMode ? "active" : ""}
              key={mode}
              onClick={() => setViewMode(mode)}
              type="button"
            >
              {mode[0].toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <button
          className="toolbar-button"
          type="button"
          onClick={() => setViewMode("week")}
        >
          <LocateFixed aria-hidden="true" size={16} />
          Today
        </button>

        <button className="primary-button compact" type="button">
          <CalendarDays aria-hidden="true" size={16} />
          Add task
        </button>
      </div>

      <div className="gantt-wrap">
        {loading ? <div className="gantt-loading">Preparing timeline…</div> : null}
        <div className="gantt-container" ref={containerRef} />
      </div>
    </section>
  );
}
