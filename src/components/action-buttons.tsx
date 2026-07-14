"use client";

import { CopyPlus, Plus } from "lucide-react";

import { useLocalStore } from "@/components/local-store";

export function NewProjectButton({
  className = "primary-button",
}: {
  className?: string;
}) {
  const { openNewProject } = useLocalStore();

  return (
    <button
      className={className}
      onClick={() => openNewProject()}
      type="button"
    >
      <Plus aria-hidden="true" size={17} />
      New project
    </button>
  );
}

export function NewTaskButton({
  projectId,
  className = "primary-button compact",
}: {
  projectId: string;
  className?: string;
}) {
  const { openNewTask } = useLocalStore();

  return (
    <button
      className={className}
      onClick={() => openNewTask(projectId)}
      type="button"
    >
      <Plus aria-hidden="true" size={16} />
      Add task
    </button>
  );
}

export function NewTemplateButton() {
  const { openNewTemplate, projects } = useLocalStore();
  const canCreateTemplate = projects.length > 0;

  return (
    <button
      className="primary-button"
      disabled={!canCreateTemplate}
      onClick={() => openNewTemplate()}
      title={
        canCreateTemplate
          ? "Create a reusable template"
          : "Create a project before saving a template"
      }
      type="button"
    >
      <CopyPlus aria-hidden="true" size={17} />
      Create template
    </button>
  );
}
