"use client";

import { Filter, LayoutGrid, List, Search } from "lucide-react";

import { NewProjectButton } from "@/components/action-buttons";
import { useLocalStore } from "@/components/local-store";
import { ProjectCard } from "@/components/project-card";
import { localToday } from "@/lib/mock-data";

export default function ProjectsPage() {
  const { projects } = useLocalStore();

  return (
    <div>
      <header className="page-heading heading-with-action">
        <div>
          <span className="eyebrow">Workspace</span>
          <h1>Projects</h1>
          <p>Every active build, its progress, and its current schedule status.</p>
        </div>
        <NewProjectButton />
      </header>

      <div className="collection-toolbar">
        <label className="collection-search">
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">Search projects</span>
          <input placeholder="Search by project, code, or location…" />
        </label>
        <button className="toolbar-button" type="button">
          <Filter aria-hidden="true" size={16} />
          Filter
        </button>
        <div className="layout-switcher" aria-label="Project layout">
          <button className="active" type="button" aria-label="Grid view">
            <LayoutGrid aria-hidden="true" size={17} />
          </button>
          <button type="button" aria-label="List view">
            <List aria-hidden="true" size={17} />
          </button>
        </div>
      </div>

      <div className="project-grid large">
        {projects.map((project) => (
          <ProjectCard project={project} today={localToday} key={project.id} />
        ))}
      </div>
    </div>
  );
}
