"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  Copy,
  MapPin,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import { AvatarStack } from "@/components/avatar-stack";
import { useLocalStore } from "@/components/local-store";
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
  const router = useRouter();
  const { duplicateProject, openDeleteProject } = useLocalStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = calculateProjectProgress(project.tasks);
  const status = getProjectScheduleStatus(project, today);
  const members = team.filter((member) => project.teamIds.includes(member.id));

  return (
    <article className="project-card">
      <div className="project-card-top">
        <span className="project-code">{project.code}</span>
        <div className="project-card-actions">
          <StatusBadge compact status={status} />
          <div className="card-menu-wrap">
            <button
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label={`More actions for ${project.name}`}
              className="card-menu-button"
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              <MoreHorizontal aria-hidden="true" size={16} />
            </button>
            {menuOpen ? (
              <div className="card-action-menu" role="menu">
                <Link
                  href={`/app/projects/${project.id}/overview`}
                  onClick={() => setMenuOpen(false)}
                  role="menuitem"
                >
                  Open overview
                </Link>
                <button
                  onClick={() => {
                    const projectId = duplicateProject(project.id);
                    setMenuOpen(false);
                    router.push(`/app/projects/${projectId}/overview`);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Copy aria-hidden="true" size={14} />
                  Duplicate
                </button>
                <button
                  className="danger-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    openDeleteProject(project.id);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={14} />
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>
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
