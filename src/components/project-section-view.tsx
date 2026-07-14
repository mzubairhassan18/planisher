"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  File,
  FolderOpen,
  Upload,
} from "lucide-react";

import { BudgetWorkspace } from "@/components/budget-workspace";
import { useLocalStore } from "@/components/local-store";
import { MetricCard } from "@/components/metric-card";
import { ProjectWorkspace } from "@/components/project-workspace";
import { StatusBadge } from "@/components/status-badge";
import { localToday } from "@/lib/local-date";
import {
  calculateProjectProgress,
  getLeafTasks,
  getTaskScheduleStatus,
} from "@/lib/progress";

export type ProjectSection = "overview" | "budget" | "files" | "activity";

function formatBytes(value: number) {
  if (value < 1_000_000) return `${Math.ceil(value / 1_000)} KB`;
  return `${(value / 1_000_000).toFixed(1)} MB`;
}

export function ProjectSectionView({
  projectId,
  section,
}: {
  projectId: string;
  section: ProjectSection;
}) {
  const store = useLocalStore();
  const project = store.projects.find((item) => item.id === projectId);

  if (!project) {
    return (
      <article className="content-card placeholder-card">
        <h2>Project not found</h2>
        <Link className="text-link" href="/app/projects">
          Return to projects
        </Link>
      </article>
    );
  }

  return (
    <ProjectWorkspace activeTab={section} project={project}>
      {section === "overview" ? (
        <ProjectOverview projectId={projectId} />
      ) : null}
      {section === "budget" ? (
        <BudgetWorkspace projectId={projectId} />
      ) : null}
      {section === "files" ? <ProjectFiles projectId={projectId} /> : null}
      {section === "activity" ? <ProjectActivity projectId={projectId} /> : null}
    </ProjectWorkspace>
  );
}

function ProjectOverview({ projectId }: { projectId: string }) {
  const { projects } = useLocalStore();
  const project = projects.find((item) => item.id === projectId);
  if (!project) return null;

  const leafTasks = getLeafTasks(project.tasks);
  const delayed = leafTasks.filter(
    (task) => getTaskScheduleStatus(task, localToday) === "delayed",
  ).length;
  const completed = leafTasks.filter(
    (task) => getTaskScheduleStatus(task, localToday) === "completed",
  ).length;

  return (
    <div className="project-section-content">
      <section className="metric-grid project-metrics">
        <MetricCard
          icon={CalendarCheck2}
          label="Overall progress"
          note="Derived from leaf tasks"
          tone="green"
          value={`${calculateProjectProgress(project.tasks)}%`}
        />
        <MetricCard
          icon={CalendarCheck2}
          label="Completed tasks"
          note={`${leafTasks.length} total tasks`}
          value={String(completed)}
        />
        <MetricCard
          icon={CalendarCheck2}
          label="Delayed tasks"
          note="Past their planned finish"
          tone={delayed ? "red" : "green"}
          value={String(delayed)}
        />
      </section>
      <section className="content-card section-card">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Next work</span>
            <h2>Upcoming tasks</h2>
          </div>
          <Link
            className="text-link"
            href={`/app/projects/${project.id}/schedule`}
          >
            Open schedule <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>
        <div className="simple-list">
          {leafTasks
            .filter((task) => task.progress < 100)
            .slice(0, 5)
            .map((task) => (
              <div className="simple-list-row" key={task.id}>
                <span>
                  <strong>{task.title}</strong>
                  <small>
                    {task.startDate} — {task.endDate}
                  </small>
                </span>
                <StatusBadge
                  compact
                  status={getTaskScheduleStatus(task, localToday)}
                />
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

function ProjectFiles({ projectId }: { projectId: string }) {
  const { addFile, files } = useLocalStore();
  const projectFiles = files.filter((file) => file.projectId === projectId);

  return (
    <div className="project-section-content">
      <section className="content-card section-card">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Documents</span>
            <h2>Project files</h2>
          </div>
          <label className="primary-button compact file-upload-button">
            <Upload aria-hidden="true" size={15} />
            Add file
            <input
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) addFile(projectId, file);
                event.target.value = "";
              }}
            />
          </label>
        </div>
        {projectFiles.length ? (
          <div className="file-list">
            {projectFiles.map((file) => (
              <div className="file-row" key={file.id}>
                <span className="file-icon">
                  <File aria-hidden="true" size={17} />
                </span>
                <span>
                  <strong>{file.name}</strong>
                  <small>
                    {formatBytes(file.sizeBytes)} · Added to local memory
                  </small>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-section">
            <FolderOpen aria-hidden="true" size={28} />
            <strong>No files yet</strong>
            <span>Add the first project document above.</span>
          </div>
        )}
      </section>
    </div>
  );
}

function ProjectActivity({ projectId }: { projectId: string }) {
  const { activity, currentUser, members, openActivity } = useLocalStore();
  const projectActivity = activity.filter(
    (item) => item.projectId === projectId,
  );

  return (
    <div className="project-section-content">
      <section className="content-card section-card">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Audit trail</span>
            <h2>Project activity</h2>
          </div>
        </div>
        <div className="activity-timeline">
          {projectActivity.length ? projectActivity.map((item) => {
            const member =
              members.find((candidate) => candidate.id === item.actorId) ??
              currentUser;
            return (
              <button
                key={item.id}
                onClick={() => openActivity(item.id)}
                type="button"
              >
                <span
                  className="avatar"
                  style={{ backgroundColor: member?.color }}
                >
                  {member.initials}
                </span>
                <span>
                  <strong>
                    {member.name} {item.action}
                  </strong>
                  <p>{item.detail}</p>
                  <small>{new Date(item.occurredAt).toLocaleString()}</small>
                </span>
                <ArrowRight aria-hidden="true" size={15} />
              </button>
            );
          }) : (
            <div className="empty-section">
              <FolderOpen aria-hidden="true" size={28} />
              <strong>No activity yet</strong>
              <span>Changes to this project will appear here.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
