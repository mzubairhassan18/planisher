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
import {
  LiveGreetingClock,
  PortfolioDonut,
} from "@/components/dashboard-pulse";
import { useLocalStore } from "@/components/local-store";
import { MetricCard } from "@/components/metric-card";
import { ProjectCard } from "@/components/project-card";
import { localToday } from "@/lib/local-date";
import {
  countTasksByStatus,
  getLeafTasks,
  getProjectScheduleStatus,
  getTaskScheduleStatus,
} from "@/lib/progress";

export default function DashboardPage() {
  const { activity, currentUser, members, openActivity, projects } =
    useLocalStore();
  const activeTasks = projects.flatMap((project) =>
    getLeafTasks(project.tasks),
  );
  const delayedTasks = countTasksByStatus(projects, "delayed", localToday);
  const completedTasks = countTasksByStatus(projects, "completed", localToday);
  const todayDate = localToday.toISOString().slice(0, 10);
  const weekEnd = new Date(localToday);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndDate = weekEnd.toISOString().slice(0, 10);
  const dueThisWeek = activeTasks.filter((task) => {
    const status = getTaskScheduleStatus(task, localToday);
    return (
      status !== "completed" &&
      task.endDate >= todayDate &&
      task.endDate <= weekEndDate
    );
  }).length;
  const delayedItems = projects
    .flatMap((project) =>
      getLeafTasks(project.tasks).map((task) => ({ project, task })),
    )
    .filter(
      ({ task }) => getTaskScheduleStatus(task, localToday) === "delayed",
    )
    .slice(0, 4);
  const firstName = currentUser.name.split(/\s+/)[0] || "there";
  const delayedProjects = projects.filter(
    (project) => getProjectScheduleStatus(project, localToday) === "delayed",
  ).length;

  return (
    <div className="dashboard-page">
      <header className="page-heading heading-with-action">
        <LiveGreetingClock firstName={firstName} />
        <NewProjectButton />
      </header>

      <section className="metric-grid" aria-label="Workspace summary">
        <MetricCard
          label="Active projects"
          value={String(projects.length)}
          note={projects.length ? "In this workspace" : "Create your first project"}
          icon={FolderKanban}
          tone="blue"
        />
        <MetricCard
          label="Delayed projects"
          value={String(delayedProjects)}
          note={`${delayedTasks} delayed ${delayedTasks === 1 ? "task" : "tasks"}`}
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

      <PortfolioDonut
        segments={[
          { label: "Active projects", value: projects.length, color: "#2d6cdf" },
          { label: "Delayed projects", value: delayedProjects, color: "#d5534f" },
          { label: "Due this week", value: dueThisWeek, color: "#d99b2b" },
          { label: "Tasks completed", value: completedTasks, color: "#2f8a63" },
        ]}
      />

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
          {projects.length ? (
            projects.map((project) => (
              <ProjectCard project={project} today={localToday} key={project.id} />
            ))
          ) : (
            <article className="content-card placeholder-card">
              <FolderKanban aria-hidden="true" size={28} />
              <h2>No projects yet</h2>
              <p>Create a blank project to begin building your schedule.</p>
              <NewProjectButton />
            </article>
          )}
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
          {delayedItems.length ? (
            delayedItems.map(({ project, task }) => (
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
            ))
          ) : (
            <div className="empty-section">
              <CalendarCheck2 aria-hidden="true" size={28} />
              <strong>No tasks need attention</strong>
              <span>Delayed work will appear here.</span>
            </div>
          )}
        </article>

        <article className="content-card activity-card">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Live record</span>
              <h2>Recent activity</h2>
            </div>
          </div>
          {activity.length ? activity.map((item) => {
            const member = members.find((candidate) => candidate.id === item.actorId);
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
                  {member?.initials ?? currentUser.initials}
                </span>
                <span>
                  <strong>
                    {member?.name ?? currentUser.name} {item.action}
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
          }) : (
            <div className="empty-section">
              <Clock3 aria-hidden="true" size={28} />
              <strong>No activity yet</strong>
              <span>Project and task updates will appear here.</span>
            </div>
          )}
        </article>

        <article className="content-card budget-glance">
          <div className="budget-icon">
            <CircleDollarSign aria-hidden="true" size={21} />
          </div>
          <span className="eyebrow">Cost overview</span>
          <h2>{projects.length ? "Budgets are ready" : "No budget data yet"}</h2>
          <p>
            {projects.length
              ? "Open the budget workspace to review planned and recorded costs."
              : "Create a project and add its planned budget when you are ready."}
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
