"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type {
  ActivityItem,
  BudgetLine,
  CostEntry,
  Project,
  ProjectFile,
  ProjectTask,
  ProjectTemplate,
  TeamMember,
  TaskComment,
} from "@/lib/types";

type DialogState =
  | { type: "new-project"; templateId?: string }
  | { type: "new-task"; projectId: string }
  | {
      type: "task";
      projectId: string;
      taskId: string;
      commentId?: string;
    }
  | { type: "new-template"; sourceProjectId?: string }
  | { type: "delete-project"; projectId: string }
  | { type: "budget-line"; projectId: string; taskId?: string }
  | { type: "cost-entry"; projectId: string; taskId?: string }
  | { type: "activity"; activityId: string }
  | null;

interface CreateProjectInput {
  name: string;
  code: string;
  location: string;
  description: string;
  startDate: string;
  endDate: string;
  budgetMinor: number;
  templateId?: string;
}

interface CreateTaskInput {
  title: string;
  startDate: string;
  endDate: string;
  progress: number;
  assigneeId?: string;
}

interface CreateTemplateInput {
  name: string;
  sourceProjectId: string;
}

interface CreateBudgetLineInput {
  projectId: string;
  taskId?: string;
  category: string;
  description: string;
  plannedMinor: number;
}

interface CreateCostEntryInput {
  projectId: string;
  taskId?: string;
  budgetLineId?: string;
  type: CostEntry["type"];
  description: string;
  vendor: string;
  amountMinor: number;
  occurredOn: string;
}

interface LocalStoreValue {
  currentUser: TeamMember;
  members: TeamMember[];
  projects: Project[];
  templates: ProjectTemplate[];
  comments: TaskComment[];
  files: ProjectFile[];
  activity: ActivityItem[];
  budgetLines: BudgetLine[];
  costEntries: CostEntry[];
  dialog: DialogState;
  closeDialog: () => void;
  openNewProject: (templateId?: string) => void;
  openNewTask: (projectId: string) => void;
  openTask: (projectId: string, taskId: string, commentId?: string) => void;
  openNewTemplate: (sourceProjectId?: string) => void;
  openDeleteProject: (projectId: string) => void;
  openBudgetLine: (projectId: string, taskId?: string) => void;
  openCostEntry: (projectId: string, taskId?: string) => void;
  openActivity: (activityId: string) => void;
  createProject: (input: CreateProjectInput) => string;
  duplicateProject: (projectId: string) => string;
  deleteProject: (projectId: string) => void;
  addTask: (projectId: string, input: CreateTaskInput) => string;
  updateTask: (
    projectId: string,
    taskId: string,
    patch: Partial<
      Pick<
        ProjectTask,
        | "progress"
        | "title"
        | "description"
        | "startDate"
        | "endDate"
        | "assigneeIds"
      >
    >,
  ) => void;
  addComment: (
    projectId: string,
    taskId: string,
    body: string,
    kind?: TaskComment["kind"],
    mediaFiles?: File[],
  ) => void;
  addFile: (projectId: string, file: File) => void;
  createTemplate: (input: CreateTemplateInput) => string;
  addBudgetLine: (input: CreateBudgetLineInput) => string;
  addCostEntry: (input: CreateCostEntryInput) => string;
}

const LocalStoreContext = createContext<LocalStoreValue | null>(null);

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function shiftDate(date: string, offsetDays: number) {
  const shifted = new Date(`${date}T12:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + offsetDays);
  return shifted.toISOString().slice(0, 10);
}

export function LocalStoreProvider({
  children,
  currentUser,
  initialTemplates = [],
}: {
  children: React.ReactNode;
  currentUser: TeamMember;
  initialTemplates?: ProjectTemplate[];
}) {
  const actorId = currentUser.id;
  const members = useMemo(() => [currentUser], [currentUser]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplate[]>(() =>
    structuredClone(initialTemplates),
  );
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [dialog, setDialog] = useState<DialogState>(null);

  const closeDialog = useCallback(() => setDialog(null), []);
  const openNewProject = useCallback((templateId?: string) => {
    setDialog({ type: "new-project", templateId });
  }, []);
  const openNewTask = useCallback(
    (projectId: string) => setDialog({ type: "new-task", projectId }),
    [],
  );
  const openTask = useCallback(
    (projectId: string, taskId: string, commentId?: string) =>
      setDialog({ type: "task", projectId, taskId, commentId }),
    [],
  );
  const openNewTemplate = useCallback((sourceProjectId?: string) => {
    setDialog({ type: "new-template", sourceProjectId });
  }, []);
  const openDeleteProject = useCallback((projectId: string) => {
    setDialog({ type: "delete-project", projectId });
  }, []);
  const openBudgetLine = useCallback((projectId: string, taskId?: string) => {
    setDialog({ type: "budget-line", projectId, taskId });
  }, []);
  const openCostEntry = useCallback((projectId: string, taskId?: string) => {
    setDialog({ type: "cost-entry", projectId, taskId });
  }, []);
  const openActivity = useCallback((activityId: string) => {
    setDialog({ type: "activity", activityId });
  }, []);

  const createProject = useCallback(
    (input: CreateProjectInput) => {
      const id = makeId("project");
      const template = input.templateId
        ? templates.find((item) => item.id === input.templateId)
        : undefined;
      const taskIdMap = new Map<string, string>();
      template?.tasks.forEach((task) => taskIdMap.set(task.id, makeId("task")));
      const templateStart = template?.tasks
        .map((task) => task.startDate)
        .sort()[0];
      const offsetDays = templateStart
        ? Math.round(
            (new Date(`${input.startDate}T12:00:00.000Z`).getTime() -
              new Date(`${templateStart}T12:00:00.000Z`).getTime()) /
              86_400_000,
          )
        : 0;
      const tasks: ProjectTask[] =
        template?.tasks.map((task) => ({
          ...structuredClone(task),
          id: taskIdMap.get(task.id) ?? makeId("task"),
          projectId: id,
          parentId: task.parentId
            ? taskIdMap.get(task.parentId)
            : undefined,
          startDate: shiftDate(task.startDate, offsetDays),
          endDate: shiftDate(task.endDate, offsetDays),
          progress: 0,
        })) ?? [];
      const dependencies =
        template?.dependencies.map((dependency) => ({
          ...structuredClone(dependency),
          id: makeId("dependency"),
          sourceTaskId:
            taskIdMap.get(dependency.sourceTaskId) ??
            dependency.sourceTaskId,
          targetTaskId:
            taskIdMap.get(dependency.targetTaskId) ??
            dependency.targetTaskId,
        })) ?? [];
      const teamIds = Array.from(
        new Set([actorId, ...tasks.flatMap((task) => task.assigneeIds)]),
      );
      const project: Project = {
        id,
        code: input.code.toUpperCase(),
        name: input.name,
        location: input.location,
        description: input.description || template?.description || "",
        startDate: input.startDate,
        endDate: input.endDate,
        budgetMinor: input.budgetMinor,
        spentMinor: 0,
        teamIds,
        tasks,
        dependencies,
        updatedAt: new Date().toISOString(),
      };

      setProjects((current) => [project, ...current]);
      if (input.budgetMinor > 0) {
        setBudgetLines((current) => [
          ...current,
          {
            id: makeId("budget-line"),
            projectId: id,
            category: "Project baseline",
            description: `${input.name} initial budget`,
            plannedMinor: input.budgetMinor,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      setActivity((current) => [
        {
          id: makeId("activity"),
          projectId: id,
          actorId,
          action: "created a project",
          detail: template
            ? `${input.name} reused ${template.tasks.length} tasks from ${template.name}.`
            : `${input.name} was added to the local workspace.`,
          targetType: "project",
          occurredAt: new Date().toISOString(),
        },
        ...current,
      ]);
      return id;
    },
    [actorId, templates],
  );

  const duplicateProject = useCallback(
    (projectId: string) => {
      const source = projects.find((project) => project.id === projectId);
      if (!source) throw new Error("Source project was not found.");
      const id = makeId("project");
      const taskIdMap = new Map(
        source.tasks.map((task) => [task.id, makeId("task")]),
      );
      const copy: Project = {
        ...structuredClone(source),
        id,
        code: `${source.code}-COPY`,
        name: `${source.name} Copy`,
        tasks: source.tasks.map((task) => ({
          ...structuredClone(task),
          id: taskIdMap.get(task.id) ?? makeId("task"),
          projectId: id,
          parentId: task.parentId
            ? taskIdMap.get(task.parentId)
            : undefined,
          progress: 0,
        })),
        dependencies: source.dependencies.map((dependency) => ({
          ...structuredClone(dependency),
          id: makeId("dependency"),
          sourceTaskId:
            taskIdMap.get(dependency.sourceTaskId) ??
            dependency.sourceTaskId,
          targetTaskId:
            taskIdMap.get(dependency.targetTaskId) ??
            dependency.targetTaskId,
        })),
        spentMinor: 0,
        updatedAt: new Date().toISOString(),
      };
      setProjects((current) => [copy, ...current]);
      if (copy.budgetMinor > 0) {
        setBudgetLines((current) => [
          ...current,
          {
            id: makeId("budget-line"),
            projectId: id,
            category: "Project baseline",
            description: `${copy.name} copied budget`,
            plannedMinor: copy.budgetMinor,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      setActivity((current) => [
        {
          id: makeId("activity"),
          projectId: id,
          actorId,
          action: "duplicated a project",
          detail: `${copy.name} was copied from ${source.name} with progress reset.`,
          targetType: "project",
          occurredAt: new Date().toISOString(),
        },
        ...current,
      ]);
      return id;
    },
    [actorId, projects],
  );

  const deleteProject = useCallback((projectId: string) => {
    setProjects((current) =>
      current.filter((project) => project.id !== projectId),
    );
    setComments((current) =>
      current.filter((comment) => comment.projectId !== projectId),
    );
    setFiles((current) =>
      current.filter((file) => file.projectId !== projectId),
    );
    setBudgetLines((current) =>
      current.filter((line) => line.projectId !== projectId),
    );
    setCostEntries((current) =>
      current.filter((entry) => entry.projectId !== projectId),
    );
    setActivity((current) =>
      current.filter((item) => item.projectId !== projectId),
    );
    setDialog(null);
  }, []);

  const addTask = useCallback(
    (projectId: string, input: CreateTaskInput) => {
      const id = makeId("task");
      const task: ProjectTask = {
        id,
        projectId,
        type: "task",
        title: input.title,
        startDate: input.startDate,
        endDate: input.endDate,
        progress: input.progress,
        assigneeIds: input.assigneeId ? [input.assigneeId] : [],
        sortOrder:
          (projects.find((project) => project.id === projectId)?.tasks.length ??
            0) + 1,
      };

      setProjects((current) =>
        current.map((project) =>
          project.id === projectId
            ? {
                ...project,
                tasks: [...project.tasks, task],
                updatedAt: new Date().toISOString(),
              }
            : project,
        ),
      );
      setActivity((current) => [
        {
          id: makeId("activity"),
          projectId,
          actorId,
          action: "added a task",
          detail: `${input.title} was added to the schedule.`,
          targetType: "task",
          taskId: id,
          occurredAt: new Date().toISOString(),
        },
        ...current,
      ]);
      return id;
    },
    [actorId, projects],
  );

  const updateTask = useCallback(
    (
      projectId: string,
      taskId: string,
      patch: Partial<
        Pick<
          ProjectTask,
          | "progress"
          | "title"
          | "description"
          | "startDate"
          | "endDate"
          | "assigneeIds"
        >
      >,
    ) => {
      let taskTitle = "Task";
      let previousProgress: number | undefined;

      setProjects((current) =>
        current.map((project) => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            tasks: project.tasks.map((task) => {
              if (task.id !== taskId) return task;
              taskTitle = task.title;
              previousProgress = task.progress;
              return { ...task, ...patch };
            }),
            updatedAt: new Date().toISOString(),
          };
        }),
      );

      if (
        patch.progress !== undefined &&
        patch.progress !== previousProgress
      ) {
        setActivity((current) => [
          {
            id: makeId("activity"),
            projectId,
            actorId,
            action: "updated progress",
            detail: `${taskTitle} moved to ${patch.progress}%.`,
            targetType: "task",
            taskId,
            occurredAt: new Date().toISOString(),
          },
          ...current,
        ]);
      }
    },
    [actorId],
  );

  const addComment = useCallback(
    (
      projectId: string,
      taskId: string,
      body: string,
      kind: TaskComment["kind"] = "comment",
      mediaFiles: File[] = [],
    ) => {
      const normalizedBody = body.trim();
      if (!normalizedBody && mediaFiles.length === 0) return;

      const comment: TaskComment = {
        id: makeId("comment"),
        projectId,
        taskId,
        authorId: actorId,
        kind,
        body: normalizedBody,
        attachments: mediaFiles.map((file) => ({
          id: makeId("comment-media"),
          name: file.name,
          type: file.type || "application/octet-stream",
          sizeBytes: file.size,
          url: URL.createObjectURL(file),
        })),
        createdAt: new Date().toISOString(),
      };

      setComments((current) => [...current, comment]);
      setActivity((current) => [
        {
          id: makeId("activity"),
          projectId,
          actorId,
          action: kind === "issue" ? "raised a problem" : "added a comment",
          detail:
            normalizedBody ||
            `Added ${mediaFiles.length} media ${
              mediaFiles.length === 1 ? "file" : "files"
            }.`,
          targetType: "comment",
          taskId,
          commentId: comment.id,
          occurredAt: comment.createdAt,
        },
        ...current,
      ]);
    },
    [actorId],
  );

  const addFile = useCallback((projectId: string, file: File) => {
    setFiles((current) => [
      {
        id: makeId("file"),
        projectId,
        name: file.name,
        sizeBytes: file.size,
        type: file.type || "application/octet-stream",
        uploadedAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setActivity((current) => [
      {
        id: makeId("activity"),
        projectId,
        actorId,
        action: "added a file",
        detail: file.name,
        targetType: "file",
        occurredAt: new Date().toISOString(),
      },
      ...current,
    ]);
  }, [actorId]);

  const addBudgetLine = useCallback((input: CreateBudgetLineInput) => {
    const id = makeId("budget-line");
    const line: BudgetLine = {
      id,
      projectId: input.projectId,
      taskId: input.taskId,
      category: input.category.trim(),
      description: input.description.trim(),
      plannedMinor: input.plannedMinor,
      createdAt: new Date().toISOString(),
    };
    setBudgetLines((current) => [...current, line]);
    setProjects((current) =>
      current.map((project) =>
        project.id === input.projectId
          ? {
              ...project,
              budgetMinor: project.budgetMinor + input.plannedMinor,
              updatedAt: new Date().toISOString(),
            }
          : project,
      ),
    );
    setActivity((current) => [
      {
        id: makeId("activity"),
        projectId: input.projectId,
        actorId,
        action: "added a budget line",
        detail: `${line.description} planned at ${(
          input.plannedMinor / 100
        ).toLocaleString()}.`,
        targetType: input.taskId ? "task" : "budget",
        taskId: input.taskId,
        occurredAt: line.createdAt,
      },
      ...current,
    ]);
    return id;
  }, [actorId]);

  const addCostEntry = useCallback((input: CreateCostEntryInput) => {
    const id = makeId("cost-entry");
    const entry: CostEntry = {
      id,
      projectId: input.projectId,
      taskId: input.taskId,
      budgetLineId: input.budgetLineId,
      type: input.type,
      description: input.description.trim(),
      vendor: input.vendor.trim(),
      amountMinor: input.amountMinor,
      occurredOn: input.occurredOn,
      createdAt: new Date().toISOString(),
    };
    setCostEntries((current) => [...current, entry]);
    if (input.type === "actual") {
      setProjects((current) =>
        current.map((project) =>
          project.id === input.projectId
            ? {
                ...project,
                spentMinor: project.spentMinor + input.amountMinor,
                updatedAt: new Date().toISOString(),
              }
            : project,
        ),
      );
    }
    setActivity((current) => [
      {
        id: makeId("activity"),
        projectId: input.projectId,
        actorId,
        action:
          input.type === "actual"
            ? "recorded an expense"
            : "recorded a commitment",
        detail: `${entry.description} · ${(
          input.amountMinor / 100
        ).toLocaleString()}.`,
        targetType: input.taskId ? "task" : "budget",
        taskId: input.taskId,
        occurredAt: entry.createdAt,
      },
      ...current,
    ]);
    return id;
  }, [actorId]);

  const createTemplate = useCallback(
    (input: CreateTemplateInput) => {
      const source = projects.find(
        (project) => project.id === input.sourceProjectId,
      );
      if (!source) throw new Error("Source project was not found.");

      const id = makeId("template");
      const template: ProjectTemplate = {
        id,
        name: input.name,
        sourceProjectId: source.id,
        description: source.description,
        tasks: source.tasks.map((task) => ({ ...task, progress: 0 })),
        dependencies: structuredClone(source.dependencies),
        createdAt: new Date().toISOString(),
      };

      setTemplates((current) => [template, ...current]);
      setActivity((current) => [
        {
          id: makeId("activity"),
          projectId: source.id,
          actorId,
          action: "created a template",
          detail: `${input.name} was created from ${source.name}.`,
          targetType: "project",
          occurredAt: new Date().toISOString(),
        },
        ...current,
      ]);
      return id;
    },
    [actorId, projects],
  );

  const value = useMemo<LocalStoreValue>(
    () => ({
      currentUser,
      members,
      projects,
      templates,
      comments,
      files,
      activity,
      budgetLines,
      costEntries,
      dialog,
      closeDialog,
      openNewProject,
      openNewTask,
      openTask,
      openNewTemplate,
      openDeleteProject,
      openBudgetLine,
      openCostEntry,
      openActivity,
      createProject,
      duplicateProject,
      deleteProject,
      addTask,
      updateTask,
      addComment,
      addFile,
      createTemplate,
      addBudgetLine,
      addCostEntry,
    }),
    [
      currentUser,
      members,
      projects,
      templates,
      comments,
      files,
      activity,
      budgetLines,
      costEntries,
      dialog,
      closeDialog,
      openNewProject,
      openNewTask,
      openTask,
      openNewTemplate,
      openDeleteProject,
      openBudgetLine,
      openCostEntry,
      openActivity,
      createProject,
      duplicateProject,
      deleteProject,
      addTask,
      updateTask,
      addComment,
      addFile,
      createTemplate,
      addBudgetLine,
      addCostEntry,
    ],
  );

  return (
    <LocalStoreContext.Provider value={value}>
      {children}
    </LocalStoreContext.Provider>
  );
}

export function useLocalStore() {
  const store = useContext(LocalStoreContext);
  if (!store) {
    throw new Error("useLocalStore must be used inside LocalStoreProvider.");
  }
  return store;
}
