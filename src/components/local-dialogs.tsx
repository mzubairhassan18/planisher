"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarDays,
  FolderKanban,
  Image as ImageIcon,
  MessageSquare,
  Mic,
  Paperclip,
  Receipt,
  Save,
  Trash2,
  UserRound,
  Video,
  X,
} from "lucide-react";

import { useLocalStore } from "@/components/local-store";
import { startNavigationProgress } from "@/components/navigation-progress";
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
          startNavigationProgress();
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
  const { addTask, closeDialog, members, projects } = useLocalStore();
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
              {members.map((member) => (
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
            placeholder="Residential build template"
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

function DeleteProjectDialog({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { closeDialog, deleteProject, projects } = useLocalStore();
  const project = projects.find((item) => item.id === projectId);
  if (!project) return null;

  return (
    <DialogFrame
      title="Delete project?"
      description="This removes the project, tasks, comments, files, and cost records from this local session."
    >
      <div className="delete-project-content">
        <div className="danger-callout">
          <Trash2 aria-hidden="true" size={18} />
          <span>
            <strong>{project.name}</strong>
            This cannot be undone after the local project is deleted.
          </span>
        </div>
        <footer className="dialog-actions">
          <button
            className="secondary-button"
            onClick={closeDialog}
            type="button"
          >
            Keep project
          </button>
          <button
            className="danger-button"
            onClick={() => {
              deleteProject(project.id);
              startNavigationProgress();
              router.push("/app/projects");
            }}
            type="button"
          >
            <Trash2 aria-hidden="true" size={15} />
            Delete project
          </button>
        </footer>
      </div>
    </DialogFrame>
  );
}

function BudgetLineDialog({
  projectId,
  taskId,
}: {
  projectId: string;
  taskId?: string;
}) {
  const { addBudgetLine, closeDialog, openTask, projects } = useLocalStore();
  const project = projects.find((item) => item.id === projectId);
  const task = project?.tasks.find((item) => item.id === taskId);
  if (!project) return null;

  return (
    <DialogFrame
      title={task ? `Add budget for ${task.title}` : "Add budget line"}
      description="Planned amounts are stored separately from commitments and actual expenses."
    >
      <form
        className="dialog-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const linkedTaskId = String(data.get("taskId") || "") || undefined;
          addBudgetLine({
            projectId,
            taskId: linkedTaskId,
            category: String(data.get("category")),
            description: String(data.get("description")),
            plannedMinor: Math.round(
              Number(data.get("plannedAmount") || 0) * 100,
            ),
          });
          closeDialog();
          if (linkedTaskId) openTask(projectId, linkedTaskId);
        }}
      >
        <div className="form-grid two-columns">
          <Field label="Category">
            <select name="category" required>
              <option>Materials</option>
              <option>Labour</option>
              <option>Subcontract</option>
              <option>Equipment</option>
              <option>Permits</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Linked task">
            <select defaultValue={taskId ?? ""} name="taskId">
              <option value="">Project-level budget</option>
              {project.tasks
                .filter((item) => item.type !== "summary")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
            </select>
          </Field>
        </div>
        <Field label="Description">
          <input
            autoFocus
            name="description"
            placeholder="Window package supply"
            required
          />
        </Field>
        <Field label="Planned amount">
          <input
            min="0"
            name="plannedAmount"
            placeholder="0"
            required
            step="0.01"
            type="number"
          />
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
            Add budget
          </button>
        </footer>
      </form>
    </DialogFrame>
  );
}

function CostEntryDialog({
  projectId,
  taskId,
}: {
  projectId: string;
  taskId?: string;
}) {
  const {
    addCostEntry,
    budgetLines,
    closeDialog,
    openTask,
    projects,
  } = useLocalStore();
  const project = projects.find((item) => item.id === projectId);
  const task = project?.tasks.find((item) => item.id === taskId);
  const projectBudgetLines = budgetLines.filter(
    (line) => line.projectId === projectId,
  );
  const defaultBudgetLineId =
    projectBudgetLines.find((line) => line.taskId === taskId)?.id ?? "";
  if (!project) return null;

  return (
    <DialogFrame
      title={task ? `Add expense for ${task.title}` : "Record project cost"}
      description="Record a commitment before purchase or an actual expense after it is incurred."
    >
      <form
        className="dialog-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const linkedTaskId = String(data.get("taskId") || "") || undefined;
          addCostEntry({
            projectId,
            taskId: linkedTaskId,
            budgetLineId:
              String(data.get("budgetLineId") || "") || undefined,
            type: String(data.get("type")) as "commitment" | "actual",
            description: String(data.get("description")),
            vendor: String(data.get("vendor")),
            amountMinor: Math.round(
              Number(data.get("amount") || 0) * 100,
            ),
            occurredOn: String(data.get("occurredOn")),
          });
          closeDialog();
          if (linkedTaskId) openTask(projectId, linkedTaskId);
        }}
      >
        <div className="form-grid two-columns">
          <Field label="Entry type">
            <select defaultValue="actual" name="type">
              <option value="actual">Actual expense</option>
              <option value="commitment">Commitment</option>
            </select>
          </Field>
          <Field label="Date">
            <input
              defaultValue={new Date().toISOString().slice(0, 10)}
              name="occurredOn"
              required
              type="date"
            />
          </Field>
        </div>
        <Field label="Linked task">
          <select defaultValue={taskId ?? ""} name="taskId">
            <option value="">Project-level cost</option>
            {project.tasks
              .filter((item) => item.type !== "summary")
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Budget line">
          <select defaultValue={defaultBudgetLineId} name="budgetLineId">
            <option value="">Not linked to a budget line</option>
            {projectBudgetLines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.category} · {line.description}
              </option>
            ))}
          </select>
        </Field>
        <div className="form-grid two-columns">
          <Field label="Description">
            <input
              autoFocus
              name="description"
              placeholder="Concrete delivery"
              required
            />
          </Field>
          <Field label="Vendor">
            <input name="vendor" placeholder="Supplier or contractor" />
          </Field>
        </div>
        <Field label="Amount">
          <input
            min="0"
            name="amount"
            placeholder="0"
            required
            step="0.01"
            type="number"
          />
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
            Record cost
          </button>
        </footer>
      </form>
    </DialogFrame>
  );
}

function ActivityDrawer({ activityId }: { activityId: string }) {
  const router = useRouter();
  const { activity, closeDialog, currentUser, members, projects } =
    useLocalStore();
  const item = activity.find((candidate) => candidate.id === activityId);
  const project = projects.find(
    (candidate) => candidate.id === item?.projectId,
  );
  const task = project?.tasks.find(
    (candidate) => candidate.id === item?.taskId,
  );
  if (!item || !project) return null;

  const member =
    members.find((candidate) => candidate.id === item.actorId) ?? currentUser;
  const destination = item.taskId
    ? `/app/projects/${project.id}/schedule?task=${encodeURIComponent(
        item.taskId,
      )}&open=1${
        item.commentId
          ? `&comment=${encodeURIComponent(item.commentId)}`
          : ""
      }`
    : item.targetType === "budget"
      ? `/app/projects/${project.id}/budget`
      : item.targetType === "file"
        ? `/app/projects/${project.id}/files`
        : `/app/projects/${project.id}/overview`;
  const destinationLabel = item.commentId
    ? "Open task comments"
    : item.taskId
      ? "Open task"
      : item.targetType === "budget"
        ? "Open project budget"
        : item.targetType === "file"
          ? "Open project files"
          : "Open project";

  return (
    <div
      className="dialog-backdrop drawer-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <aside
        aria-label="Activity details"
        aria-modal="true"
        className="task-drawer activity-drawer"
        role="dialog"
      >
        <header className="dialog-header">
          <div>
            <span className="drawer-status status-on_time">Activity</span>
            <h2>{item.action}</h2>
            <p>{new Date(item.occurredAt).toLocaleString()}</p>
          </div>
          <button
            aria-label="Close activity details"
            className="icon-button"
            onClick={closeDialog}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>
        <div className="drawer-section activity-detail-person">
          <span
            className="avatar"
            style={{ backgroundColor: member?.color }}
          >
            {member.initials}
          </span>
          <span>
            <strong>{member.name}</strong>
            <small>{member.role}</small>
          </span>
        </div>
        <div className="drawer-section">
          <span className="eyebrow">Recorded change</span>
          <p className="activity-detail-copy">{item.detail}</p>
          <dl className="activity-target-facts">
            <div>
              <dt>Project</dt>
              <dd>{project.name}</dd>
            </div>
            {task ? (
              <div>
                <dt>Task</dt>
                <dd>{task.title}</dd>
              </div>
            ) : null}
            <div>
              <dt>Destination</dt>
              <dd>{item.targetType ?? "project"}</dd>
            </div>
          </dl>
        </div>
        <div className="drawer-section activity-navigation">
          <button
            className="primary-button"
            onClick={() => {
              closeDialog();
              startNavigationProgress();
              router.push(destination);
            }}
            type="button"
          >
            {destinationLabel}
            <ArrowRight aria-hidden="true" size={15} />
          </button>
          {item.taskId ? (
            <button
              className="secondary-button"
              onClick={() => {
                closeDialog();
                startNavigationProgress();
                router.push(`/app/projects/${project.id}/overview`);
              }}
              type="button"
            >
              <FolderKanban aria-hidden="true" size={15} />
              Project overview
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function TaskDrawer({
  projectId,
  taskId,
  focusCommentId,
}: {
  projectId: string;
  taskId: string;
  focusCommentId?: string;
}) {
  const {
    addComment,
    budgetLines,
    closeDialog,
    comments,
    costEntries,
    currentUser,
    members,
    openBudgetLine,
    openCostEntry,
    projects,
    updateTask,
  } = useLocalStore();
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
  const [commentBody, setCommentBody] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [saved, setSaved] = useState(false);
  const taskComments = useMemo(
    () => comments.filter((comment) => comment.taskId === taskId),
    [comments, taskId],
  );
  const issueCount = taskComments.filter(
    (comment) => comment.kind === "issue",
  ).length;
  const taskBudgetLines = budgetLines.filter(
    (line) => line.projectId === projectId && line.taskId === taskId,
  );
  const taskPlanned = taskBudgetLines.reduce(
    (sum, line) => sum + line.plannedMinor,
    0,
  );
  const taskActual = costEntries
    .filter(
      (entry) =>
        entry.projectId === projectId &&
        entry.taskId === taskId &&
        entry.type === "actual",
    )
    .reduce((sum, entry) => sum + entry.amountMinor, 0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDialog();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDialog]);

  useEffect(() => {
    if (!focusCommentId) return;
    document
      .getElementById(`comment-${focusCommentId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusCommentId, taskComments]);

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
                {members.map((member) => (
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
            {saved ? "Saved" : "Save"}
          </button>
        </form>

        <div className="drawer-section task-cost-section">
          <div className="drawer-section-title">
            <Banknote aria-hidden="true" size={16} />
            Task cost
          </div>
          <div className="task-cost-summary">
            <span>
              <small>Budget</small>
              <strong>{(taskPlanned / 100).toLocaleString()}</strong>
            </span>
            <span>
              <small>Expenses</small>
              <strong>{(taskActual / 100).toLocaleString()}</strong>
            </span>
            <span>
              <small>Remaining</small>
              <strong>
                {((taskPlanned - taskActual) / 100).toLocaleString()}
              </strong>
            </span>
          </div>
          <div className="task-cost-actions">
            <button
              className="secondary-button"
              onClick={() => openBudgetLine(projectId, taskId)}
              type="button"
            >
              <Banknote aria-hidden="true" size={15} />
              Add budget
            </button>
            <button
              className="secondary-button"
              onClick={() => openCostEntry(projectId, taskId)}
              type="button"
            >
              <Receipt aria-hidden="true" size={15} />
              Add expense
            </button>
          </div>
        </div>

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
              taskComments.map((comment) => {
                const author =
                  members.find((member) => member.id === comment.authorId) ??
                  currentUser;
                return (
                <article
                  className={[
                    "comment",
                    comment.kind === "issue" ? "issue-comment" : "",
                    comment.id === focusCommentId ? "focused-comment" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  id={`comment-${comment.id}`}
                  key={comment.id}
                >
                  <span
                    className="avatar"
                    style={{ backgroundColor: author.color }}
                  >
                    {author.initials}
                  </span>
                  <div>
                    <strong>
                      {author.name}
                      {comment.kind === "issue" ? (
                        <em className="issue-label">
                          <AlertTriangle aria-hidden="true" size={11} />
                          Problem raised
                        </em>
                      ) : null}
                    </strong>
                    {comment.body ? <p>{comment.body}</p> : null}
                    {(comment.attachments ?? []).length ? (
                      <div className="comment-media-grid">
                        {(comment.attachments ?? []).map((attachment) => (
                          <figure key={attachment.id}>
                            {attachment.type.startsWith("image/") ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                alt={attachment.name}
                                src={attachment.url}
                              />
                            ) : null}
                            {attachment.type.startsWith("video/") ? (
                              <video controls preload="metadata">
                                <source
                                  src={attachment.url}
                                  type={attachment.type}
                                />
                              </video>
                            ) : null}
                            {attachment.type.startsWith("audio/") ? (
                              <audio controls preload="metadata">
                                <source
                                  src={attachment.url}
                                  type={attachment.type}
                                />
                              </audio>
                            ) : null}
                            <figcaption>{attachment.name}</figcaption>
                          </figure>
                        ))}
                      </div>
                    ) : null}
                    <small>Just now</small>
                  </div>
                </article>
                );
              })
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
              addComment(
                projectId,
                taskId,
                commentBody,
                commentKind,
                selectedMedia,
              );
              setCommentBody("");
              setSelectedMedia([]);
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
            <div className="comment-media-picker">
              <label className="secondary-button compact">
                <Paperclip aria-hidden="true" size={14} />
                Add image, video, or audio
                <input
                  accept="image/*,video/*,audio/*"
                  multiple
                  onChange={(event) =>
                    setSelectedMedia(Array.from(event.target.files ?? []))
                  }
                  type="file"
                />
              </label>
              <span className="media-type-hints" aria-hidden="true">
                <ImageIcon size={14} />
                <Video size={14} />
                <Mic size={14} />
              </span>
            </div>
            {selectedMedia.length ? (
              <div className="selected-media-list">
                {selectedMedia.map((file) => (
                  <span key={`${file.name}-${file.size}`}>
                    {file.name}
                    <small>{Math.ceil(file.size / 1000)} KB</small>
                  </span>
                ))}
              </div>
            ) : null}
            <textarea
              aria-label={
                commentKind === "issue"
                  ? "Describe the problem"
                  : "Add a comment"
              }
              name="comment"
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder={
                commentKind === "issue"
                  ? "Describe what is blocked, damaged, missing, or needs a decision…"
                  : "Share a site update…"
              }
              rows={3}
              value={commentBody}
            />
            <button
              className="primary-button compact"
              disabled={!commentBody.trim() && selectedMedia.length === 0}
              type="submit"
            >
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
  if (dialog.type === "delete-project") {
    return <DeleteProjectDialog projectId={dialog.projectId} />;
  }
  if (dialog.type === "budget-line") {
    return (
      <BudgetLineDialog
        projectId={dialog.projectId}
        taskId={dialog.taskId}
      />
    );
  }
  if (dialog.type === "cost-entry") {
    return (
      <CostEntryDialog projectId={dialog.projectId} taskId={dialog.taskId} />
    );
  }
  if (dialog.type === "activity") {
    return <ActivityDrawer activityId={dialog.activityId} />;
  }
  if (dialog.type === "task") {
    return (
      <TaskDrawer
        focusCommentId={dialog.commentId}
        key={dialog.taskId}
        projectId={dialog.projectId}
        taskId={dialog.taskId}
      />
    );
  }
  return null;
}
