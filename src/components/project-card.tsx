import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";

import { AvatarStack } from "@/components/avatar-stack";
import { StatusBadge } from "@/components/status-badge";
import { team } from "@/lib/mock-data";
import {
  calculateProjectProgress,
  getProjectScheduleStatus,
} from "@/lib/progress";
import type { Project } from "@/lib/types";

export function ProjectCard({
  project,
  today,
}: {
  project: Project;
  today: Date;
}) {
  const progress = calculateProjectProgress(project.tasks);
  const status = getProjectScheduleStatus(project, today);
  const members = team.filter((member) => project.teamIds.includes(member.id));

  return (
    <article className="project-card">
      <div className="project-card-top">
        <span className="project-code">{project.code}</span>
        <StatusBadge compact status={status} />
      </div>
      <div>
        <h3>{project.name}</h3>
        <p>
          <MapPin aria-hidden="true" size={14} />
          {project.location}
        </p>
      </div>
      <div className="progress-heading">
        <span>Overall progress</span>
        <strong>{progress}%</strong>
      </div>
      <div
        className="progress-track"
        aria-label={`${project.name} is ${progress}% complete`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="project-card-footer">
        <AvatarStack members={members} />
        <Link href={`/app/projects/${project.id}/schedule`}>
          Open plan
          <ArrowUpRight aria-hidden="true" size={15} />
        </Link>
      </div>
    </article>
  );
}
