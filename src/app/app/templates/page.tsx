"use client";

import { CalendarRange, Library, Play } from "lucide-react";

import { NewTemplateButton } from "@/components/action-buttons";
import { useLocalStore } from "@/components/local-store";

export default function TemplatesPage() {
  const { openNewProject, projects, templates } = useLocalStore();

  return (
    <div>
      <header className="page-heading heading-with-action">
        <div>
          <span className="eyebrow">Reusable plans</span>
          <h1>Templates</h1>
          <p>Turn a successful project structure into the next calm start.</p>
        </div>
        <NewTemplateButton />
      </header>
      {templates.length ? (
        <div className="template-grid">
          {templates.map((template) => {
            const source = projects.find(
              (project) => project.id === template.sourceProjectId,
            );
            return (
              <article className="content-card template-card" key={template.id}>
                <div className="template-card-icon">
                  <CalendarRange aria-hidden="true" size={20} />
                </div>
                <span className="eyebrow">
                  {template.isStarter
                    ? `${template.category ?? "Construction"} starter`
                    : "Workspace template"}
                </span>
                <h2>{template.name}</h2>
                <p>{template.description || "Reusable construction plan."}</p>
                <dl>
                  <div>
                    <dt>Tasks</dt>
                    <dd>{template.tasks.length}</dd>
                  </div>
                  <div>
                    <dt>Dependencies</dt>
                    <dd>{template.dependencies.length}</dd>
                  </div>
                  <div>
                    <dt>{template.isStarter ? "Duration" : "Source"}</dt>
                    <dd>
                      {template.isStarter
                        ? `${template.estimatedDurationDays ?? "—"} days`
                        : source?.name ?? "Project"}
                    </dd>
                  </div>
                </dl>
                <button
                  className="secondary-button template-use-button"
                  onClick={() => openNewProject(template.id)}
                  type="button"
                >
                  <Play aria-hidden="true" size={15} />
                  Use this template
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <article className="content-card placeholder-card">
          <Library aria-hidden="true" size={28} />
          <h2>No saved templates yet</h2>
          <p>
            Create one from an existing project. Tasks and dependencies copy
            while historical progress stays behind.
          </p>
        </article>
      )}
    </div>
  );
}
