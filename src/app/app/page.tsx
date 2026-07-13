"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CircleDollarSign,
  Clock3,
  FolderKanban,
  TriangleAlert,
} from "lucide-react";

import { NewProjectButton } from "@/components/action-buttons";
import { useLocalStore } from "@/components/local-store";
import { MetricCard } from "@/components/metric-card";
import { ProjectCard } from "@/components/project-card";
import { getMember, localToday } from "@/lib/mock-data";
import {
  countTasksByStatus,
  getLeafTasks,
  getTaskScheduleStatus,
} from "@/lib/progress";

export default function DashboardPage() {
  const { activity, openActivity, projects } = useLocalStore();
  const activeTasks = projects.flatMap((project) =>
    getLeafTasks(project.tasks),
  );
  const delayedTasks = countTasksByStatus(projects, "delayed", localToday);
  const completedTasks = countTasksByStatus(projects, "completed", localToday);
  const dueThisWeek = activeTasks.filter((task) => {
    const status = getTaskScheduleStatus(task, localToday);
    return (
      status !== "completed" &&
      task.endDate >= "2026-07-04" &&
      task.endDate <= "2026-07-11"
    );
  }).length;

  return (
    <div className="dashboard-page">
      <header className="page-heading heading-with-action">
        <div>
          <span className="eyebrow">Saturday, 4 July</span>
          <h1>Good afternoon, Amina.</h1>
          <p>Here is what needs your attention across the build programme.</p>
        </div>
        <NewProjectButton />
      </header>

      <section className="metric-grid" aria-label="Workspace summary">
        <MetricCard
          label="Active projects"
          value={String(projects.length)}
          note="Across three cities"
          icon={FolderKanban}
          tone="blue"
        />
        <MetricCard
          label="Delayed tasks"
          value={String(delayedTasks)}
          note="Needs a schedule update"
          icon={TriangleAlert}
          tone="red"
        />
        <MetricCard
          label="Due this week"
          value={String(dueThisWeek)}
          note="Across active plans"
          icon={Clock3}
        />
        <MetricCard
          label="Tasks completed"
          value={String(completedTasks)}
          note="Current portfolio"
          icon={CalendarCheck2}
          tone="green"
        />
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Portfolio</span>
            <h2>Active projects</h2>
          </div>
          <Link className="text-link" href="/app/projects">
            View all
            <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard project={project} today={localToday} key={project.id} />
          ))}
        </div>
      </section>

      <section className="dashboard-lower-grid">
        <article className="content-card attention-card">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Priority</span>
              <h2>Needs attention</h2>
            </div>
            <span className="attention-count">{delayedTasks}</span>
          </div>
          {projects
            .flatMap((project) =>
              getLeafTasks(project.tasks).map((task) => ({ project, task })),
            )
            .filter(
              ({ task }) =>
                getTaskScheduleStatus(task, localToday) === "delayed",
            )
            .slice(0, 4)
            .map(({ project, task }) => (
              <Link
                className="attention-row"
                href={`/app/projects/${project.id}/schedule?task=${encodeURIComponent(task.id)}`}
                key={task.id}
              >
                <span className="attention-dot" />
                <span>
                  <strong>{task.title}</strong>
                  <small>
                    {project.name} · ended {task.endDate}
                  </small>
                </span>
                <span>{task.progress}%</span>
              </Link>
            ))}
        </article>

        <article className="content-card activity-card">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Live record</span>
              <h2>Recent activity</h2>
            </div>
          </div>
          {activity.map((item) => {
            const member = getMember(item.actorId);
            const project = projects.find(
              (candidate) => candidate.id === item.projectId,
            );

            return (
              <button
                className="activity-row"
                key={item.id}
                onClick={() => openActivity(item.id)}
                type="button"
              >
                <span
                  className="avatar"
                  style={{ backgroundColor: member?.color }}
                >
                  {member?.initials}
                </span>
                <span>
                  <strong>
                    {member?.name} {item.action}
                  </strong>
                  <small>{item.detail}</small>
                  <em>{project?.name} · recently</em>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="activity-row-arrow"
                  size={15}
                />
              </button>
            );
          })}
        </article>

        <article className="content-card budget-glance">
          <div className="budget-icon">
            <CircleDollarSign aria-hidden="true" size={21} />
          </div>
          <span className="eyebrow">Cost overview</span>
          <h2>Budgets are steady</h2>
          <p>
            Total recorded spend is below the planned portfolio curve. Open the
            budget workspace for detail.
          </p>
          <Link className="text-link" href="/app/budget">
            Review budgets
            <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </article>
      </section>
    </div>
  );
}
