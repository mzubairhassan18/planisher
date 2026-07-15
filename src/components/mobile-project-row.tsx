import Link from "next/link";
import { ChevronRight, FolderKanban, MapPin } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import {
  calculateProjectProgress,
  getProjectScheduleStatus,
} from "@/lib/progress";
import type { Project } from "@/lib/types";

export function MobileProjectRow({
  project,
  today,
}: {
  project: Project;
  today: Date;
}) {
  const progress = calculateProjectProgress(project.tasks);
  const status = getProjectScheduleStatus(project, today);

  return (
    <Link
      aria-label={`Open ${project.name} task list`}
      className="mobile-project-row"
      href={`/app/projects/${project.id}/schedule`}
    >
      {project.coverImage ? (
        <span
          aria-hidden="true"
          className="mobile-project-thumbnail"
          style={{ backgroundImage: `url(${project.coverImage.url})` }}
        />
      ) : (
        <span className="mobile-project-thumbnail empty" aria-hidden="true">
          <FolderKanban size={19} />
        </span>
      )}
      <span className="mobile-project-row-copy">
        <span className="mobile-project-row-heading">
          <span className="project-code">{project.code}</span>
          <StatusBadge compact status={status} />
        </span>
        <strong>{project.name}</strong>
        <small>
          <MapPin aria-hidden="true" size={12} />
          {project.location}
        </small>
        <span className="mobile-project-row-progress">
          <span className="progress-track">
            <i style={{ width: `${progress}%` }} />
          </span>
          <em>{progress}%</em>
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="mobile-project-chevron" size={18} />
    </Link>
  );
}
