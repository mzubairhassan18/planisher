"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/utils/supabase/client";
import {
  finishNavigationProgress,
  startNavigationProgress,
} from "@/components/navigation-progress";
import {
  persistBudgetLine,
  persistComment,
  persistCostEntry,
  persistDeleteProject,
  persistFile,
  persistProjectBundle,
  persistTask,
  persistTaskUpdate,
  type PersistenceContext,
} from "@/lib/supabase/store-persistence-client";

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
  | { type: "new-task"; projectId: string; parentTaskId?: string }
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
  coverImageFile?: File;
}

interface CreateTaskInput {
  title: string;
  startDate: string;
  endDate: string;
  progress: number;
  assigneeId?: string;
  parentTaskId?: string;
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
  openNewTask: (projectId: string, parentTaskId?: string) => void;
  openTask: (projectId: string, taskId: string, commentId?: string) => void;
  openNewTemplate: (sourceProjectId?: string) => void;
  openDeleteProject: (projectId: string) => void;
  openBudgetLine: (projectId: string, taskId?: string) => void;
  openCostEntry: (projectId: string, taskId?: string) => void;
  openActivity: (activityId: string) => void;
  createProject: (input: CreateProjectInput) => Promise<string>;
  duplicateProject: (projectId: string) => Promise<string>;
  deleteProject: (projectId: string) => Promise<void>;
  addTask: (projectId: string, input: CreateTaskInput) => Promise<string>;
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
  ) => Promise<void>;
  addComment: (
    projectId: string,
    taskId: string,
    body: string,
    kind?: TaskComment["kind"],
    mediaFiles?: File[],
  ) => Promise<void>;
  addFile: (projectId: string, file: File) => Promise<void>;
  createTemplate: (input: CreateTemplateInput) => Promise<string>;
  addBudgetLine: (input: CreateBudgetLineInput) => Promise<string>;
  addCostEntry: (input: CreateCostEntryInput) => Promise<string>;
  isPersisting: boolean;
  persistenceError: string | null;
  clearPersistenceError: () => void;
}

const LocalStoreContext = createContext<LocalStoreValue | null>(null);

function makeId(prefix: string) {
  void prefix;
  return crypto.randomUUID();
}

function shiftDate(date: string, offsetDays: number) {
  const shifted = new Date(`${date}T12:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + offsetDays);
  return shifted.toISOString().slice(0, 10);
}

export function LocalStoreProvider({
  children,
  currency,
  currentUser,
  initialActivity = [],
  initialBudgetLines = [],
  initialComments = [],
  initialCostEntries = [],
  initialFiles = [],
  initialMembers = [],
  initialProjects = [],
  initialTemplates = [],
  timezone,
  workspaceId,
}: {
  children: React.ReactNode;
  currency: string;
  currentUser: TeamMember;
  initialActivity?: ActivityItem[];
  initialBudgetLines?: BudgetLine[];
  initialComments?: TaskComment[];
  initialCostEntries?: CostEntry[];
  initialFiles?: ProjectFile[];
  initialMembers?: TeamMember[];
  initialProjects?: Project[];
  initialTemplates?: ProjectTemplate[];
  timezone: string;
  workspaceId: string;
}) {
  const actorId = currentUser.id;
  const supabase = useMemo(() => createClient(), []);
  const persistenceContext = useMemo<PersistenceContext>(
    () => ({ actorId, currency, supabase, timezone, workspaceId }),
    [actorId, currency, supabase, timezone, workspaceId],
  );
  const members = useMemo(
    () =>
      initialMembers.length
        ? structuredClone(initialMembers)
        : [currentUser],
    [currentUser, initialMembers],
  );
  const [projects, setProjects] = useState<Project[]>(() =>
    structuredClone(initialProjects),
  );
  const [templates, setTemplates] = useState<ProjectTemplate[]>(() =>
    structuredClone(initialTemplates),
  );
  const [comments, setComments] = useState<TaskComment[]>(() =>
    structuredClone(initialComments),
  );
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>(() =>
    structuredClone(initialBudgetLines),
  );
  const [costEntries, setCostEntries] = useState<CostEntry[]>(() =>
    structuredClone(initialCostEntries),
  );
  const [files, setFiles] = useState<ProjectFile[]>(() =>
    structuredClone(initialFiles),
  );
  const [activity, setActivity] = useState<ActivityItem[]>(() =>
    structuredClone(initialActivity),
  );
  const [dialog, setDialog] = useState<DialogState>(null);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  const clearPersistenceError = useCallback(() => setPersistenceError(null), []);
  const withPersistence = useCallback(async <T,>(operation: () => Promise<T>) => {
    setPendingOperations((count) => count + 1);
    setPersistenceError(null);
    try {
      return await operation();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The change could not be saved.";
      setPersistenceError(message);
      throw error;
    } finally {
      setPendingOperations((count) => Math.max(0, count - 1));
    }
  }, []);

  useEffect(() => {
    if (pendingOperations > 0) {
      startNavigationProgress();
      return;
    }
    finishNavigationProgress();
  }, [pendingOperations]);

  const closeDialog = useCallback(() => setDialog(null), []);
  const openNewProject = useCallback((templateId?: string) => {
    setDialog({ type: "new-project", templateId });
  }, []);
  const openNewTask = useCallback(
    (projectId: string, parentTaskId?: string) =>
      setDialog({ type: "new-task", projectId, parentTaskId }),
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
    async (input: CreateProjectInput) => {
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
        coverImage: undefined,
        teamIds,
        tasks,
        dependencies,
        updatedAt: new Date().toISOString(),
      };
      const baselineBudget: BudgetLine | undefined =
        input.budgetMinor > 0
          ? {
              id: makeId("budget-line"),
              projectId: id,
              category: "Project baseline",
              description: `${input.name} initial budget`,
              plannedMinor: input.budgetMinor,
              createdAt: new Date().toISOString(),
            }
          : undefined;
      const activityItem: ActivityItem = {
        id: makeId("activity"),
        projectId: id,
        actorId,
        action: "created a project",
        detail: template
          ? `${input.name} reused ${template.tasks.length} tasks from ${template.name}.`
          : `${input.name} was added to the workspace.`,
        targetType: "project",
        occurredAt: new Date().toISOString(),
      };

      const coverImage = await withPersistence(() =>
        persistProjectBundle({
          activity: activityItem,
          baselineBudget,
          context: persistenceContext,
          coverFile: input.coverImageFile,
          project,
          sourceProjectId: template?.isStarter ? undefined : template?.id,
        }),
      );
      project.coverImage = coverImage;
      setProjects((current) => [project, ...current]);
      if (baselineBudget) {
        setBudgetLines((current) => [...current, baselineBudget]);
      }
      setActivity((current) => [activityItem, ...current]);
      return id;
    },
    [actorId, persistenceContext, templates, withPersistence],
  );

  const duplicateProject = useCallback(
    async (projectId: string) => {
      const source = projects.find((project) => project.id === projectId);
      if (!source) throw new Error("Source project was not found.");
      const id = makeId("project");
      const taskIdMap = new Map(
        source.tasks.map((task) => [task.id, makeId("task")]),
      );
      const copy: Project = {
        ...structuredClone(source),
        id,
        code: `${source.code}-C${id.slice(0, 4).toUpperCase()}`,
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
        coverImage: undefined,
        updatedAt: new Date().toISOString(),
      };
      const baselineBudget: BudgetLine | undefined =
        copy.budgetMinor > 0
          ? {
              id: makeId("budget-line"),
              projectId: id,
              category: "Project baseline",
              description: `${copy.name} copied budget`,
              plannedMinor: copy.budgetMinor,
              createdAt: new Date().toISOString(),
            }
          : undefined;
      const activityItem: ActivityItem = {
        id: makeId("activity"),
        projectId: id,
        actorId,
        action: "duplicated a project",
        detail: `${copy.name} was copied from ${source.name} with progress reset.`,
        targetType: "project",
        occurredAt: new Date().toISOString(),
      };
      await withPersistence(() =>
        persistProjectBundle({
          activity: activityItem,
          baselineBudget,
          context: persistenceContext,
          project: copy,
          sourceProjectId: source.id,
        }),
      );
      setProjects((current) => [copy, ...current]);
      if (baselineBudget) {
        setBudgetLines((current) => [...current, baselineBudget]);
      }
      setActivity((current) => [activityItem, ...current]);
      return id;
    },
    [actorId, persistenceContext, projects, withPersistence],
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      await withPersistence(() =>
        persistDeleteProject(persistenceContext, projectId),
      );
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
    },
    [persistenceContext, withPersistence],
  );

  const addTask = useCallback(
    async (projectId: string, input: CreateTaskInput) => {
      const id = makeId("task");
      const task: ProjectTask = {
        id,
        projectId,
        type: "task",
        parentId: input.parentTaskId,
        title: input.title,
        startDate: input.startDate,
        endDate: input.endDate,
        progress: input.progress,
        assigneeIds: input.assigneeId ? [input.assigneeId] : [],
        sortOrder:
          (projects.find((project) => project.id === projectId)?.tasks.length ??
            0) + 1,
      };
      const activityItem: ActivityItem = {
        id: makeId("activity"),
        projectId,
        actorId,
        action: "added a task",
        detail: `${input.title} was added to the schedule.`,
        targetType: "task",
        taskId: id,
        occurredAt: new Date().toISOString(),
      };
      await withPersistence(() =>
        persistTask(persistenceContext, task, activityItem),
      );
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
      setActivity((current) => [activityItem, ...current]);
      return id;
    },
    [actorId, persistenceContext, projects, withPersistence],
  );

  const updateTask = useCallback(
    async (
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
      const project = projects.find((candidate) => candidate.id === projectId);
      const existingTask = project?.tasks.find((task) => task.id === taskId);
      if (!project || !existingTask) throw new Error("Task was not found.");
      const activityItem: ActivityItem | undefined =
        patch.progress !== undefined && patch.progress !== existingTask.progress
          ? {
              id: makeId("activity"),
              projectId,
              actorId,
              action: "updated progress",
              detail: `${existingTask.title} moved to ${patch.progress}%.`,
              targetType: "task",
              taskId,
              occurredAt: new Date().toISOString(),
            }
          : undefined;

      setProjects((current) =>
        current.map((candidate) =>
          candidate.id === projectId
            ? {
                ...candidate,
                tasks: candidate.tasks.map((task) =>
                  task.id === taskId ? { ...task, ...patch } : task,
                ),
                updatedAt: new Date().toISOString(),
              }
            : candidate,
        ),
      );
      try {
        await withPersistence(() =>
          persistTaskUpdate(
            persistenceContext,
            projectId,
            taskId,
            patch,
            activityItem,
            existingTask.assigneeIds,
          ),
        );
      } catch (error) {
        setProjects((current) =>
          current.map((candidate) =>
            candidate.id === projectId
              ? {
                  ...candidate,
                  tasks: candidate.tasks.map((task) =>
                    task.id === taskId ? existingTask : task,
                  ),
                  updatedAt: project.updatedAt,
                }
              : candidate,
          ),
        );
        throw error;
      }
      if (activityItem) {
        setActivity((current) => [activityItem, ...current]);
      }
    },
    [actorId, persistenceContext, projects, withPersistence],
  );

  const addComment = useCallback(
    async (
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
        attachments: [],
        createdAt: new Date().toISOString(),
      };
      const activityItem: ActivityItem = {
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
      };
      comment.attachments = await withPersistence(() =>
        persistComment({
          activity: activityItem,
          comment,
          context: persistenceContext,
          mediaFiles,
        }),
      );
      setComments((current) => [...current, comment]);
      setActivity((current) => [activityItem, ...current]);
    },
    [actorId, persistenceContext, withPersistence],
  );

  const addFile = useCallback(
    async (projectId: string, file: File) => {
      const activityItem: ActivityItem = {
        id: makeId("activity"),
        projectId,
        actorId,
        action: "added a file",
        detail: file.name,
        targetType: "file",
        occurredAt: new Date().toISOString(),
      };
      const persistedFile = await withPersistence(() =>
        persistFile(persistenceContext, projectId, file, activityItem),
      );
      setFiles((current) => [persistedFile, ...current]);
      setActivity((current) => [activityItem, ...current]);
    },
    [actorId, persistenceContext, withPersistence],
  );

  const addBudgetLine = useCallback(async (input: CreateBudgetLineInput) => {
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
    const activityItem: ActivityItem = {
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
    };
    await withPersistence(() =>
      persistBudgetLine(persistenceContext, line, activityItem),
    );
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
    setActivity((current) => [activityItem, ...current]);
    return id;
  }, [actorId, persistenceContext, withPersistence]);

  const addCostEntry = useCallback(async (input: CreateCostEntryInput) => {
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
    const activityItem: ActivityItem = {
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
    };
    await withPersistence(() =>
      persistCostEntry(persistenceContext, entry, activityItem),
    );
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
    setActivity((current) => [activityItem, ...current]);
    return id;
  }, [actorId, persistenceContext, withPersistence]);

  const createTemplate = useCallback(
    async (input: CreateTemplateInput) => {
      const source = projects.find(
        (project) => project.id === input.sourceProjectId,
      );
      if (!source) throw new Error("Source project was not found.");

      const id = makeId("template");
      const taskIdMap = new Map(
        source.tasks.map((task) => [task.id, makeId("task")]),
      );
      const templateTasks = source.tasks.map((task) => ({
        ...structuredClone(task),
        id: taskIdMap.get(task.id)!,
        projectId: id,
        parentId: task.parentId ? taskIdMap.get(task.parentId) : undefined,
        progress: 0,
        assigneeIds: [],
      }));
      const templateDependencies = source.dependencies.map((dependency) => ({
        ...structuredClone(dependency),
        id: makeId("dependency"),
        sourceTaskId: taskIdMap.get(dependency.sourceTaskId)!,
        targetTaskId: taskIdMap.get(dependency.targetTaskId)!,
      }));
      const template: ProjectTemplate = {
        id,
        name: input.name,
        sourceProjectId: source.id,
        description: source.description,
        tasks: templateTasks,
        dependencies: templateDependencies,
        createdAt: new Date().toISOString(),
      };
      const templateProject: Project = {
        id,
        code: `TPL-${id.slice(0, 8).toUpperCase()}`,
        name: input.name,
        location: source.location,
        description: source.description,
        startDate: source.startDate,
        endDate: source.endDate,
        budgetMinor: 0,
        spentMinor: 0,
        teamIds: [actorId],
        tasks: templateTasks,
        dependencies: templateDependencies,
        updatedAt: new Date().toISOString(),
      };
      const activityItem: ActivityItem = {
        id: makeId("activity"),
        projectId: source.id,
        actorId,
        action: "created a template",
        detail: `${input.name} was created from ${source.name}.`,
        targetType: "project",
        occurredAt: new Date().toISOString(),
      };
      await withPersistence(() =>
        persistProjectBundle({
          activity: activityItem,
          context: persistenceContext,
          kind: "template",
          project: templateProject,
          sourceProjectId: source.id,
        }),
      );
      setTemplates((current) => [template, ...current]);
      setActivity((current) => [activityItem, ...current]);
      return id;
    },
    [actorId, persistenceContext, projects, withPersistence],
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
      isPersisting: pendingOperations > 0,
      persistenceError,
      clearPersistenceError,
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
      pendingOperations,
      persistenceError,
      clearPersistenceError,
    ],
  );

  return (
    <LocalStoreContext.Provider value={value}>
      {children}
      {pendingOperations > 0 ? (
        <div className="persistence-saving" role="status">
          Saving to Supabase…
        </div>
      ) : null}
      {persistenceError ? (
        <div className="persistence-error" role="alert">
          <span>
            <strong>Could not save this change.</strong>
            {persistenceError}
          </span>
          <button onClick={clearPersistenceError} type="button">
            Dismiss
          </button>
        </div>
      ) : null}
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
