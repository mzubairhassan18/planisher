"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  MessageSquare,
  Save,
  UserRound,
  X,
} from "lucide-react";

import { useLocalStore } from "@/components/local-store";
import { team } from "@/lib/mock-data";
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
  const { createProject, closeDialog, dialog, templates } = useLocalStore();
  const today = new Date().toISOString().slice(0, 10);
  const initialTemplateId =
    dialog?.type === "new-project" ? dialog.templateId ?? "" : "";
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const selectedTemplate = templates.find(
    (template) => template.id === templateId,
  );

  return (
    <DialogFrame
      title="Create a project"
      description="Start blank or reuse the task structure from a saved template."
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
            templateId: String(data.get("templateId") || "") || undefined,
          });
          closeDialog();
          router.push(`/app/projects/${id}/overview`);
        }}
      >
        <Field label="Start from">
          <select
            name="templateId"
            onChange={(event) => setTemplateId(event.target.value)}
            value={templateId}
          >
            <option value="">Blank project</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} · {template.tasks.length} tasks
              </option>
            ))}
          </select>
        </Field>
        {selectedTemplate ? (
          <div className="template-selection-note">
            <CalendarDays aria-hidden="true" size={17} />
            <span>
              <strong>
                {selectedTemplate.tasks.length} tasks will be reused
              </strong>
              Dates shift to the new project start; progress resets to 0%.
            </span>
          </div>
        ) : null}
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
  const { closeDialog, createTemplate, dialog, projects } = useLocalStore();
  const sourceProjectId =
    dialog?.type === "new-template" ? dialog.sourceProjectId : undefined;

  return (
    <DialogFrame
      title="Create a template"
      description="Copy a project's task structure and dependencies. Historical progress is reset."
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
          <select
            defaultValue={sourceProjectId ?? projects[0]?.id}
            name="sourceProjectId"
            required
          >
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
  const { addComment, closeDialog, comments, projects, updateTask } =
    useLocalStore();
  const project = projects.find((item) => item.id === projectId);
  const task = project?.tasks.find((item) => item.id === taskId);
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [startDate, setStartDate] = useState(task?.startDate ?? "");
  const [endDate, setEndDate] = useState(task?.endDate ?? "");
  const [assigneeId, setAssigneeId] = useState(
    task?.assigneeIds[0] ?? "",
  );
  const [progress, setProgress] = useState(task?.progress ?? 0);
  const [commentKind, setCommentKind] =
    useState<"comment" | "issue">("comment");
  const [saved, setSaved] = useState(false);
  const taskComments = useMemo(
    () => comments.filter((comment) => comment.taskId === taskId),
    [comments, taskId],
  );
  const issueCount = taskComments.filter(
    (comment) => comment.kind === "issue",
  ).length;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDialog();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDialog]);

  if (!project || !task) return null;

  const status = getTaskScheduleStatus(task);
  const originalTitle = task.title;

  function saveTask(form: HTMLFormElement) {
    const data = new FormData(form);
    const nextTitle = String(data.get("title")).trim() || originalTitle;
    const nextDescription = String(data.get("description")).trim();
    const nextStartDate = String(data.get("startDate"));
    const nextEndDate = String(data.get("endDate"));
    const nextAssigneeId = String(data.get("assigneeId") || "");
    const nextProgress = Math.max(
      0,
      Math.min(100, Number(data.get("progress") || 0)),
    );
    setTitle(nextTitle);
    setDescription(nextDescription);
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
    setAssigneeId(nextAssigneeId);
    setProgress(nextProgress);
    updateTask(projectId, taskId, {
      title: nextTitle,
      description: nextDescription,
      startDate: nextStartDate,
      endDate: nextEndDate,
      assigneeIds: nextAssigneeId ? [nextAssigneeId] : [],
      progress: nextProgress,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

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
            <h2>{title || task.title}</h2>
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

        <form
          className="drawer-section task-edit-form"
          onSubmit={(event) => {
            event.preventDefault();
            saveTask(event.currentTarget);
          }}
        >
          <div className="drawer-section-title">
            <CalendarDays aria-hidden="true" size={16} />
            Task details
          </div>
          <Field label="Task name">
            <input
              name="title"
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </Field>
          <Field label="Description">
            <textarea
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add the work scope, acceptance notes, or site instructions…"
              rows={3}
              value={description}
            />
          </Field>
          <div className="form-grid two-columns">
            <Field label="Start date">
              <input
                max={endDate}
                name="startDate"
                onChange={(event) => setStartDate(event.target.value)}
                required
                type="date"
                value={startDate}
              />
            </Field>
            <Field label="End date">
              <input
                min={startDate}
                name="endDate"
                onChange={(event) => setEndDate(event.target.value)}
                required
                type="date"
                value={endDate}
              />
            </Field>
          </div>
          <Field label="Assignee">
            <span className="select-with-icon">
              <UserRound aria-hidden="true" size={15} />
              <select
                name="assigneeId"
                onChange={(event) => setAssigneeId(event.target.value)}
                value={assigneeId}
              >
                <option value="">Unassigned</option>
                {team.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} · {member.role}
                  </option>
                ))}
              </select>
            </span>
          </Field>
          <Field label="Progress">
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
                  name="progress"
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
          </Field>
          <button className="primary-button drawer-save" type="submit">
            <Save aria-hidden="true" size={15} />
            {saved ? "Changes saved" : "Save task changes"}
          </button>
        </form>

        <div className="drawer-section comments-section">
          <div className="drawer-section-title">
            <MessageSquare aria-hidden="true" size={16} />
            Updates and problems
            <span>{taskComments.length}</span>
          </div>
          {issueCount ? (
            <div className="open-issue-summary">
              <AlertTriangle aria-hidden="true" size={15} />
              {issueCount} {issueCount === 1 ? "problem" : "problems"} raised
              on this task
            </div>
          ) : null}
          <div className="comment-list">
            {taskComments.length ? (
              taskComments.map((comment) => (
                <article
                  className={
                    comment.kind === "issue"
                      ? "comment issue-comment"
                      : "comment"
                  }
                  key={comment.id}
                >
                  <span className="avatar">AK</span>
                  <div>
                    <strong>
                      Amina Khan
                      {comment.kind === "issue" ? (
                        <em className="issue-label">
                          <AlertTriangle aria-hidden="true" size={11} />
                          Problem raised
                        </em>
                      ) : null}
                    </strong>
                    <p>{comment.body}</p>
                    <small>Just now</small>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-copy">
                No updates yet. Share progress or raise a problem.
              </p>
            )}
          </div>
          <form
            className="comment-form"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              addComment(
                projectId,
                taskId,
                String(data.get("comment")),
                commentKind,
              );
              form.reset();
            }}
          >
            <div
              aria-label="Update type"
              className="comment-kind-switcher"
              role="group"
            >
              <button
                aria-pressed={commentKind === "comment"}
                className={commentKind === "comment" ? "active" : ""}
                onClick={() => setCommentKind("comment")}
                type="button"
              >
                <MessageSquare aria-hidden="true" size={14} />
                Comment
              </button>
              <button
                aria-pressed={commentKind === "issue"}
                className={commentKind === "issue" ? "active issue" : "issue"}
                onClick={() => setCommentKind("issue")}
                type="button"
              >
                <AlertTriangle aria-hidden="true" size={14} />
                Raise a problem
              </button>
            </div>
            <textarea
              aria-label={
                commentKind === "issue"
                  ? "Describe the problem"
                  : "Add a comment"
              }
              name="comment"
              placeholder={
                commentKind === "issue"
                  ? "Describe what is blocked, damaged, missing, or needs a decision…"
                  : "Share a site update…"
              }
              required
              rows={3}
            />
            <button className="primary-button compact" type="submit">
              {commentKind === "issue" ? "Raise problem" : "Add comment"}
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
