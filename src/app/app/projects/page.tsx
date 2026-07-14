"use client";

import { useMemo, useState } from "react";
import {
  Filter,
  FolderSearch,
  LayoutGrid,
  List,
  Search,
} from "lucide-react";

import { NewProjectButton } from "@/components/action-buttons";
import { useLocalStore } from "@/components/local-store";
import { ProjectCard } from "@/components/project-card";
import { localToday } from "@/lib/local-date";
import { getProjectScheduleStatus } from "@/lib/progress";
import type { ScheduleStatus } from "@/lib/types";

type ProjectFilter = "all" | ScheduleStatus;

const filterOptions: Array<{ value: ProjectFilter; label: string }> = [
  { value: "all", label: "All projects" },
  { value: "delayed", label: "Delayed" },
  { value: "on_time", label: "On time" },
  { value: "completed", label: "Completed" },
  { value: "not_started", label: "Not started" },
];

export default function ProjectsPage() {
  const { projects } = useLocalStore();
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] =
    useState<ProjectFilter>("all");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesQuery =
        !normalizedQuery ||
        [project.name, project.code, project.location].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      const matchesStatus =
        statusFilter === "all" ||
        getProjectScheduleStatus(project, localToday) === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [projects, query, statusFilter]);
  const activeFilterLabel =
    filterOptions.find((option) => option.value === statusFilter)?.label ??
    "Filter";

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
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by project, code, or location…"
            value={query}
          />
        </label>
        <div className="collection-filter-wrap">
          <button
            aria-expanded={filterOpen}
            aria-haspopup="menu"
            className={
              statusFilter === "all"
                ? "toolbar-button"
                : "toolbar-button active"
            }
            onClick={() => setFilterOpen((open) => !open)}
            type="button"
          >
            <Filter aria-hidden="true" size={16} />
            {activeFilterLabel}
          </button>
          {filterOpen ? (
            <div className="collection-filter-menu" role="menu">
              {filterOptions.map((option) => (
                <button
                  aria-checked={statusFilter === option.value}
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setFilterOpen(false);
                  }}
                  role="menuitemradio"
                  type="button"
                >
                  <span className={`filter-status-dot ${option.value}`} />
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <span className="project-result-count">
          {visibleProjects.length} of {projects.length}
        </span>
        <div className="layout-switcher" aria-label="Project layout">
          <button
            aria-label="Grid view"
            aria-pressed={layout === "grid"}
            className={layout === "grid" ? "active" : ""}
            onClick={() => setLayout("grid")}
            type="button"
          >
            <LayoutGrid aria-hidden="true" size={17} />
          </button>
          <button
            aria-label="List view"
            aria-pressed={layout === "list"}
            className={layout === "list" ? "active" : ""}
            onClick={() => setLayout("list")}
            type="button"
          >
            <List aria-hidden="true" size={17} />
          </button>
        </div>
      </div>

      {visibleProjects.length ? (
        <div
          className={
            layout === "list"
              ? "project-grid large list-view"
              : "project-grid large"
          }
        >
          {visibleProjects.map((project) => (
            <ProjectCard project={project} today={localToday} key={project.id} />
          ))}
        </div>
      ) : (
        <article className="content-card project-empty-results">
          <FolderSearch aria-hidden="true" size={28} />
          <h2>{projects.length ? "No projects match" : "No projects yet"}</h2>
          <p>
            {projects.length
              ? "Try another search or return the status filter to all projects."
              : "Create your first project to start planning tasks, costs, and progress."}
          </p>
          {projects.length ? (
            <button
              className="secondary-button"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
              }}
              type="button"
            >
              Clear filters
            </button>
          ) : (
            <NewProjectButton />
          )}
        </article>
      )}
    </div>
  );
}
