"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  CalendarDays,
  ChevronRight,
  CircleCheckBig,
  Flag,
  GitBranch,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { NewTaskButton } from "@/components/action-buttons";
import { StatusBadge } from "@/components/status-badge";
import {
  calculateProjectProgress,
  getTaskScheduleStatus,
} from "@/lib/progress";
import type { Project, ScheduleStatus } from "@/lib/types";

type TaskFilter = "all" | ScheduleStatus | "issues";

export function MobileTaskList({
  issueTaskIds,
  project,
}: {
  issueTaskIds: Set<string>;
  project: Project;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const progress = calculateProjectProgress(project.tasks);
  const visibleTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...project.tasks]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((task) => {
        const matchesText =
          !normalized ||
          task.title.toLowerCase().includes(normalized) ||
          task.description?.toLowerCase().includes(normalized);
        const matchesFilter =
          filter === "all" ||
          (filter === "issues"
            ? issueTaskIds.has(task.id)
            : getTaskScheduleStatus(task) === filter);
        return matchesText && matchesFilter;
      });
  }, [filter, issueTaskIds, project.tasks, query]);

  function taskDepth(taskId: string) {
    let depth = 0;
    let current = project.tasks.find((task) => task.id === taskId);
    const visited = new Set<string>();
    while (current?.parentId && !visited.has(current.parentId)) {
      visited.add(current.parentId);
      depth += 1;
      current = project.tasks.find((task) => task.id === current?.parentId);
    }
    return Math.min(depth, 3);
  }

  return (
    <div className="mobile-project-tasks">
      <section className="mobile-project-summary">
        {project.coverImage ? (
          <div
            aria-label={`${project.name} cover image`}
            className="mobile-project-cover"
            role="img"
            style={{ backgroundImage: `url(${project.coverImage.url})` }}
          />
        ) : null}
        <span className="eyebrow">{project.code}</span>
        <h1>{project.name}</h1>
        <p>{project.location}</p>
        <div className="mobile-project-progress">
          <span>
            <strong>{progress}%</strong>
            <small>overall progress</small>
          </span>
          <div className="progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="mobile-project-actions">
          <NewTaskButton className="primary-button compact" projectId={project.id} />
          <Link className="secondary-button compact" href={`/app/projects/${project.id}/activity`}>
            <Activity aria-hidden="true" size={15} /> Activity
          </Link>
        </div>
      </section>

      <section className="mobile-task-section">
        <div className="mobile-section-heading">
          <div>
            <span className="eyebrow">Field schedule</span>
            <h2>Tasks</h2>
          </div>
          <span>{visibleTasks.length}</span>
        </div>
        <label className="mobile-search-field">
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">Search tasks</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this task list…"
            value={query}
          />
        </label>
        <div className="mobile-filter-row" aria-label="Filter tasks">
          <SlidersHorizontal aria-hidden="true" size={15} />
          {(["all", "delayed", "on_time", "completed", "issues"] as TaskFilter[]).map(
            (option) => (
              <button
                aria-pressed={filter === option}
                className={filter === option ? "active" : ""}
                key={option}
                onClick={() => setFilter(option)}
                type="button"
              >
                {option.replace("_", " ")}
              </button>
            ),
          )}
        </div>

        <div className="mobile-task-list">
          {visibleTasks.length ? (
            visibleTasks.map((task) => {
              const status = getTaskScheduleStatus(task);
              const predecessor = project.dependencies.find(
                (dependency) => dependency.targetTaskId === task.id,
              );
              const predecessorTask = predecessor
                ? project.tasks.find((item) => item.id === predecessor.sourceTaskId)
                : undefined;
              const children = project.tasks.filter((item) => item.parentId === task.id);
              const depth = taskDepth(task.id);
              return (
                <Link
                  className="mobile-task-row"
                  href={`/app/projects/${project.id}/schedule?task=${encodeURIComponent(task.id)}&open=1`}
                  key={task.id}
                  style={{ "--task-depth": depth } as React.CSSProperties}
                >
                  <span className={`mobile-task-status status-${status}`}>
                    {status === "completed" ? (
                      <CircleCheckBig aria-hidden="true" size={16} />
                    ) : issueTaskIds.has(task.id) ? (
                      <Flag aria-hidden="true" size={16} />
                    ) : (
                      <span>{task.progress}%</span>
                    )}
                  </span>
                  <span className="mobile-task-copy">
                    <strong>{task.title}</strong>
                    <small>
                      <CalendarDays aria-hidden="true" size={12} />
                      {task.startDate} – {task.endDate}
                    </small>
                    {predecessorTask ? (
                      <em>
                        <ArrowDownRight aria-hidden="true" size={12} />
                        After {predecessorTask.title}
                      </em>
                    ) : children.length ? (
                      <em>
                        <GitBranch aria-hidden="true" size={12} />
                        {children.length} {children.length === 1 ? "subtask" : "subtasks"}
                      </em>
                    ) : null}
                  </span>
                  <StatusBadge compact status={status} />
                  <ChevronRight aria-hidden="true" size={17} />
                </Link>
              );
            })
          ) : (
            <div className="mobile-empty-list">
              <Plus aria-hidden="true" size={24} />
              <strong>No matching tasks</strong>
              <span>Try another search or filter.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
