import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MoreHorizontal, Plus } from "lucide-react";

import { AvatarStack } from "@/components/avatar-stack";
import { ScheduleGantt } from "@/components/schedule-gantt";
import { StatusBadge } from "@/components/status-badge";
import { getProject, localToday, team } from "@/lib/mock-data";
import {
  calculateProjectProgress,
  getProjectScheduleStatus,
} from "@/lib/progress";

export default async function ProjectSchedulePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = getProject(projectId);

  if (!project) notFound();

  const progress = calculateProjectProgress(project.tasks);
  const status = getProjectScheduleStatus(project, localToday);
  const members = team.filter((member) => project.teamIds.includes(member.id));

  return (
    <div className="schedule-page">
      <div className="breadcrumbs">
        <Link href="/app/projects">Projects</Link>
        <ChevronRight aria-hidden="true" size={14} />
        <span>{project.name}</span>
      </div>

      <header className="project-heading">
        <div>
          <div className="project-title-row">
            <span className="project-code">{project.code}</span>
            <StatusBadge status={status} />
          </div>
          <h1>{project.name}</h1>
          <p>
            {project.location} · {project.startDate} — {project.endDate}
          </p>
        </div>
        <div className="project-heading-actions">
          <div className="project-progress-summary">
            <span>{progress}% complete</span>
            <div className="progress-track small">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
          <AvatarStack members={members} limit={4} />
          <button className="secondary-button" type="button">
            <Plus aria-hidden="true" size={16} />
            Add task
          </button>
          <button className="icon-button" type="button" aria-label="More project actions">
            <MoreHorizontal aria-hidden="true" size={18} />
          </button>
        </div>
      </header>

      <nav className="project-tabs" aria-label="Project sections">
        <a href="#overview">Overview</a>
        <a className="active" href="#schedule">
          Schedule
        </a>
        <a href="#budget">Budget</a>
        <a href="#files">Files</a>
        <a href="#activity">Activity</a>
      </nav>

      <div className="status-legend" aria-label="Schedule status legend">
        <span>
          <i className="legend-dot on-time" /> On time
        </span>
        <span>
          <i className="legend-dot delayed" /> Delayed
        </span>
        <span>
          <i className="legend-dot completed" /> Completed
        </span>
        <span>
          <i className="legend-dot not-started" /> Not started
        </span>
      </div>

      <ScheduleGantt project={project} today={localToday} />
    </div>
  );
}
