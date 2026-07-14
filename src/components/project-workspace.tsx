"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Copy,
  LayoutDashboard,
  Library,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import { AvatarStack } from "@/components/avatar-stack";
import { useLocalStore } from "@/components/local-store";
import { StatusBadge } from "@/components/status-badge";
import { localToday } from "@/lib/local-date";
import {
  calculateProjectProgress,
  getProjectScheduleStatus,
} from "@/lib/progress";
import type { Project } from "@/lib/types";

type ProjectTab = "overview" | "schedule" | "budget" | "files" | "activity";

const tabs: Array<{ key: ProjectTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "schedule", label: "Schedule" },
  { key: "budget", label: "Budget" },
  { key: "files", label: "Files" },
  { key: "activity", label: "Activity" },
];

export function ProjectWorkspace({
  project,
  activeTab,
  actions,
  children,
}: {
  project: Project;
  activeTab: ProjectTab;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const {
    duplicateProject,
    members: workspaceMembers,
    openDeleteProject,
    openNewTemplate,
  } = useLocalStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = calculateProjectProgress(project.tasks);
  const status = getProjectScheduleStatus(project, localToday);
  const members = workspaceMembers.filter((member) =>
    project.teamIds.includes(member.id),
  );

  return (
    <div className="schedule-page">
      <div className="breadcrumbs">
        <Link href="/app/projects">Projects</Link>
        <span aria-hidden="true">/</span>
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
          {actions}
          <div className="project-action-menu-wrap">
            <button
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="More project actions"
              className="icon-button"
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              <MoreHorizontal aria-hidden="true" size={18} />
            </button>
            {menuOpen ? (
              <div className="project-action-menu" role="menu">
                <span className="workspace-menu-label">Project actions</span>
                <Link
                  href={`/app/projects/${project.id}/overview`}
                  onClick={() => setMenuOpen(false)}
                  role="menuitem"
                >
                  <LayoutDashboard aria-hidden="true" size={15} />
                  Open overview
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    openNewTemplate(project.id);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Library aria-hidden="true" size={15} />
                  Save as template
                </button>
                <button
                  onClick={() => {
                    const projectId = duplicateProject(project.id);
                    setMenuOpen(false);
                    router.push(`/app/projects/${projectId}/overview`);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Copy aria-hidden="true" size={15} />
                  Duplicate project
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
                  <Trash2 aria-hidden="true" size={15} />
                  Delete project
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <nav className="project-tabs" aria-label="Project sections">
        {tabs.map((tab) => (
          <Link
            className={activeTab === tab.key ? "active" : ""}
            href={`/app/projects/${project.id}/${tab.key}`}
            key={tab.key}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
