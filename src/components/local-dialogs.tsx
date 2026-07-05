"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MessageSquare, X } from "lucide-react";

import { useLocalStore } from "@/components/local-store";
import { getMember, team } from "@/lib/mock-data";
import { getTaskScheduleStatus } from "@/lib/progress";

function DialogFrame({
  title,
  description,
  children,
  wide = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const { closeDialog } = useLocalStore();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDialog();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDialog]);

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <section
        aria-describedby="dialog-description"
        aria-modal="true"
        className={wide ? "dialog-card dialog-wide" : "dialog-card"}
        role="dialog"
      >
        <header className="dialog-header">
          <div>
            <h2>{title}</h2>
            <p id="dialog-description">{description}</p>
          </div>
          <button
            aria-label="Close dialog"
            className="icon-button"
            onClick={closeDialog}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function NewProjectDialog() {
  const router = useRouter();
  const { createProject, closeDialog } = useLocalStore();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <DialogFrame
      title="Create a project"
      description="Start with the essentials. Timezone and currency are detected automatically."
    >
      <form
        className="dialog-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const id = createProject({
            name: String(data.get("name")),
            code: String(data.get("code")),
            location: String(data.get("location")),
            description: String(data.get("description")),
            startDate: String(data.get("startDate")),
            endDate: String(data.get("endDate")),
            budgetMinor:
              Math.round(Number(data.get("budget") || 0) * 100) || 0,
          });
          closeDialog();
          router.push(`/app/projects/${id}/overview`);
        }}
      >
        <div className="form-grid two-columns">
          <Field label="Project name">
            <input autoFocus name="name" placeholder="Garden House" required />
          </Field>
          <Field label="Project code">
            <input name="code" placeholder="GH-001" required />
          </Field>
        </div>
        <Field label="Location">
          <input name="location" placeholder="City or site name" required />
        </Field>
        <Field label="Description">
          <textarea
            name="description"
            placeholder="A short description of this build…"
            rows={3}
          />
        </Field>
        <div className="form-grid two-columns">
          <Field label="Start date">
            <input defaultValue={today} name="startDate" required type="date" />
          </Field>
          <Field label="End date">
            <input name="endDate" required type="date" />
          </Field>
        </div>
        <Field label="Planned budget">
          <input min="0" name="budget" placeholder="0" step="1" type="number" />
        </Field>
        <footer className="dialog-actions">
          <button
            className="secondary-button"
            onClick={closeDialog}
            type="button"
          >
            Cancel
          </button>
          <button className="primary-button" type="submit">
            Create project
          </button>
        </footer>
      </form>
    </DialogFrame>
  );
}

function NewTaskDialog({ projectId }: { projectId: string }) {
  const { addTask, closeDialog, projects } = useLocalStore();
  const project = projects.find((item) => item.id === projectId);

  if (!project) return null;

  return (
    <DialogFrame
      title="Add a task"
      description={`Add work to ${project.name}. Its status color will be calculated from dates and progress.`}
    >
      <form
        className="dialog-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          addTask(projectId, {
            title: String(data.get("title")),
            startDate: String(data.get("startDate")),
            endDate: String(data.get("endDate")),
            progress: Number(data.get("progress") || 0),
            assigneeId: String(data.get("assigneeId") || "") || undefined,
          });
          closeDialog();
        }}
      >
        <Field label="Task name">
          <input autoFocus name="title" placeholder="Install windows" required />
        </Field>
        <div className="form-grid two-columns">
          <Field label="Start date">
            <input
              defaultValue={project.startDate}
              name="startDate"
              required
              type="date"
            />
          </Field>
          <Field label="End date">
            <input
              defaultValue={project.endDate}
              name="endDate"
              required
              type="date"
            />
          </Field>
        </div>
        <div className="form-grid two-columns">
          <Field label="Progress">
            <input
              defaultValue="0"
              max="100"
              min="0"
              name="progress"
              type="number"
            />
          </Field>
          <Field label="Assignee">
            <select name="assigneeId">
              <option value="">Unassigned</option>
              {team.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <footer className="dialog-actions">
          <button
            className="secondary-button"
            onClick={closeDialog}
            type="button"
          >
            Cancel
          </button>
          <button className="primary-button" type="submit">
            Add task
          </button>
        </footer>
      </form>
    </DialogFrame>
  );
}

function NewTemplateDialog() {
  const { closeDialog, createTemplate, projects } = useLocalStore();

  return (
    <DialogFrame
      title="Create a template"
      description="Copy a project’s task structure and dependencies. Historical progress is reset."
    >
      <form
        className="dialog-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          createTemplate({
            name: String(data.get("name")),
            sourceProjectId: String(data.get("sourceProjectId")),
          });
          closeDialog();
        }}
      >
        <Field label="Template name">
          <input
            autoFocus
            name="name"
            placeholder="Two-storey home baseline"
            required
          />
        </Field>
        <Field label="Source project">
          <select name="sourceProjectId" required>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </Field>
        <footer className="dialog-actions">
          <button
            className="secondary-button"
            onClick={closeDialog}
            type="button"
          >
            Cancel
          </button>
          <button className="primary-button" type="submit">
            Create template
          </button>
        </footer>
      </form>
    </DialogFrame>
  );
}

function TaskDrawer({
  projectId,
  taskId,
}: {
  projectId: string;
  taskId: string;
}) {
  const {
    addComment,
    closeDialog,
    comments,
    projects,
    updateTask,
  } = useLocalStore();
  const project = projects.find((item) => item.id === projectId);
  const task = project?.tasks.find((item) => item.id === taskId);
  const [progress, setProgress] = useState(task?.progress ?? 0);
  const taskComments = useMemo(
    () => comments.filter((comment) => comment.taskId === taskId),
    [comments, taskId],
  );

  if (!project || !task) return null;

  const status = getTaskScheduleStatus(task);
  const assignees = task.assigneeIds
    .map((id) => getMember(id))
    .filter((member) => Boolean(member));

  return (
    <div
      className="dialog-backdrop drawer-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <aside
        aria-label={`${task.title} details`}
        aria-modal="true"
        className="task-drawer"
        role="dialog"
      >
        <header className="dialog-header">
          <div>
            <span className={`drawer-status status-${status}`}>
              {status.replace("_", " ")}
            </span>
            <h2>{task.title}</h2>
            <p>{project.name}</p>
          </div>
          <button
            aria-label="Close task details"
            className="icon-button"
            onClick={closeDialog}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <div className="drawer-section">
          <div className="drawer-section-title">
            <CalendarDays aria-hidden="true" size={16} />
            Task progress
          </div>
          <div className="progress-editor">
            <input
              aria-label="Task progress"
              max="100"
              min="0"
              onChange={(event) => setProgress(Number(event.target.value))}
              type="range"
              value={progress}
            />
            <label className="progress-number">
              <span className="sr-only">Progress percentage</span>
              <input
                aria-label="Progress percentage"
                max="100"
                min="0"
                onChange={(event) =>
                  setProgress(
                    Math.max(0, Math.min(100, Number(event.target.value))),
                  )
                }
                type="number"
                value={progress}
              />
              <span>%</span>
            </label>
          </div>
          <button
            className="primary-button drawer-save"
            onClick={() => updateTask(projectId, taskId, { progress })}
            type="button"
          >
            Save progress
          </button>
          <dl className="task-facts">
            <div>
              <dt>Start</dt>
              <dd>{task.startDate}</dd>
            </div>
            <div>
              <dt>End</dt>
              <dd>{task.endDate}</dd>
            </div>
            <div>
              <dt>Assigned</dt>
              <dd>
                {assignees.length
                  ? assignees.map((member) => member?.name).join(", ")
                  : "Unassigned"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="drawer-section comments-section">
          <div className="drawer-section-title">
            <MessageSquare aria-hidden="true" size={16} />
            Comments
            <span>{taskComments.length}</span>
          </div>
          <div className="comment-list">
            {taskComments.length ? (
              taskComments.map((comment) => (
                <article className="comment" key={comment.id}>
                  <span className="avatar">AK</span>
                  <div>
                    <strong>Amina Khan</strong>
                    <p>{comment.body}</p>
                    <small>Just now</small>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-copy">No comments yet. Add the first update.</p>
            )}
          </div>
          <form
            className="comment-form"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              addComment(projectId, taskId, String(data.get("comment")));
              form.reset();
            }}
          >
            <textarea
              aria-label="Add a comment"
              name="comment"
              placeholder="Share a site update…"
              required
              rows={3}
            />
            <button className="primary-button compact" type="submit">
              Add comment
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}

export function LocalDialogs() {
  const { dialog } = useLocalStore();

  if (!dialog) return null;
  if (dialog.type === "new-project") return <NewProjectDialog />;
  if (dialog.type === "new-task") {
    return <NewTaskDialog projectId={dialog.projectId} />;
  }
  if (dialog.type === "new-template") return <NewTemplateDialog />;
  if (dialog.type === "task") {
    return (
      <TaskDrawer
        key={dialog.taskId}
        projectId={dialog.projectId}
        taskId={dialog.taskId}
      />
    );
  }
  return null;
}
