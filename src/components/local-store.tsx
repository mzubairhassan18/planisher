"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  activity as seededActivity,
  projects as seededProjects,
} from "@/lib/mock-data";
import type {
  ActivityItem,
  Project,
  ProjectFile,
  ProjectTask,
  ProjectTemplate,
  TaskComment,
} from "@/lib/types";

type DialogState =
  | { type: "new-project"; templateId?: string }
  | { type: "new-task"; projectId: string }
  | { type: "task"; projectId: string; taskId: string }
  | { type: "new-template"; sourceProjectId?: string }
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

interface LocalStoreValue {
  projects: Project[];
  templates: ProjectTemplate[];
  comments: TaskComment[];
  files: ProjectFile[];
  activity: ActivityItem[];
  dialog: DialogState;
  closeDialog: () => void;
  openNewProject: (templateId?: string) => void;
  openNewTask: (projectId: string) => void;
  openTask: (projectId: string, taskId: string) => void;
  openNewTemplate: (sourceProjectId?: string) => void;
  createProject: (input: CreateProjectInput) => string;
  duplicateProject: (projectId: string) => string;
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
  ) => void;
  addFile: (projectId: string, file: File) => void;
  createTemplate: (input: CreateTemplateInput) => string;
}

const LocalStoreContext = createContext<LocalStoreValue | null>(null);

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function cloneSeedProjects() {
  return structuredClone(seededProjects);
}

function cloneSeedTemplates(): ProjectTemplate[] {
  const source = seededProjects[0];
  return [
    {
      id: "template-two-storey-home",
      name: "Two-storey home baseline",
      sourceProjectId: source.id,
      description:
        "A reusable residential sequence from site preparation through structural frame.",
      tasks: source.tasks.map((task) => ({ ...structuredClone(task), progress: 0 })),
      dependencies: structuredClone(source.dependencies),
      createdAt: "2026-07-01T08:00:00.000Z",
    },
  ];
}

function shiftDate(date: string, offsetDays: number) {
  const shifted = new Date(`${date}T12:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + offsetDays);
  return shifted.toISOString().slice(0, 10);
}

export function LocalStoreProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(cloneSeedProjects);
  const [templates, setTemplates] =
    useState<ProjectTemplate[]>(cloneSeedTemplates);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([
    {
      id: "file-1",
      projectId: "riverside-villa",
      name: "foundation-inspection.pdf",
      sizeBytes: 1_840_000,
      type: "application/pdf",
      uploadedAt: "2026-07-03T09:20:00.000Z",
    },
    {
      id: "file-2",
      projectId: "riverside-villa",
      name: "drainage-detail.dwg",
      sizeBytes: 3_210_000,
      type: "application/acad",
      uploadedAt: "2026-07-02T13:10:00.000Z",
    },
  ]);
  const [activity, setActivity] =
    useState<ActivityItem[]>(structuredClone(seededActivity));
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
    (projectId: string, taskId: string) =>
      setDialog({ type: "task", projectId, taskId }),
    [],
  );
  const openNewTemplate = useCallback((sourceProjectId?: string) => {
    setDialog({ type: "new-template", sourceProjectId });
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
        new Set(["member-1", ...tasks.flatMap((task) => task.assigneeIds)]),
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
      setActivity((current) => [
        {
          id: makeId("activity"),
          projectId: id,
          actorId: "member-1",
          action: "created a project",
          detail: template
            ? `${input.name} reused ${template.tasks.length} tasks from ${template.name}.`
            : `${input.name} was added to the local workspace.`,
          occurredAt: new Date().toISOString(),
        },
        ...current,
      ]);
      return id;
    },
    [templates],
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
      setActivity((current) => [
        {
          id: makeId("activity"),
          projectId: id,
          actorId: "member-1",
          action: "duplicated a project",
          detail: `${copy.name} was copied from ${source.name} with progress reset.`,
          occurredAt: new Date().toISOString(),
        },
        ...current,
      ]);
      return id;
    },
    [projects],
  );

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
          actorId: "member-1",
          action: "added a task",
          detail: `${input.title} was added to the schedule.`,
          occurredAt: new Date().toISOString(),
        },
        ...current,
      ]);
      return id;
    },
    [projects],
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
            actorId: "member-1",
            action: "updated progress",
            detail: `${taskTitle} moved to ${patch.progress}%.`,
            occurredAt: new Date().toISOString(),
          },
          ...current,
        ]);
      }
    },
    [],
  );

  const addComment = useCallback(
    (
      projectId: string,
      taskId: string,
      body: string,
      kind: TaskComment["kind"] = "comment",
    ) => {
      const normalizedBody = body.trim();
      if (!normalizedBody) return;

      const comment: TaskComment = {
        id: makeId("comment"),
        projectId,
        taskId,
        authorId: "member-1",
        kind,
        body: normalizedBody,
        createdAt: new Date().toISOString(),
      };

      setComments((current) => [...current, comment]);
      setActivity((current) => [
        {
          id: makeId("activity"),
          projectId,
          actorId: "member-1",
          action: kind === "issue" ? "raised a problem" : "added a comment",
          detail: normalizedBody,
          occurredAt: comment.createdAt,
        },
        ...current,
      ]);
    },
    [],
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
        actorId: "member-1",
        action: "added a file",
        detail: file.name,
        occurredAt: new Date().toISOString(),
      },
      ...current,
    ]);
  }, []);

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
          actorId: "member-1",
          action: "created a template",
          detail: `${input.name} was created from ${source.name}.`,
          occurredAt: new Date().toISOString(),
        },
        ...current,
      ]);
      return id;
    },
    [projects],
  );

  const value = useMemo<LocalStoreValue>(
    () => ({
      projects,
      templates,
      comments,
      files,
      activity,
      dialog,
      closeDialog,
      openNewProject,
      openNewTask,
      openTask,
      openNewTemplate,
      createProject,
      duplicateProject,
      addTask,
      updateTask,
      addComment,
      addFile,
      createTemplate,
    }),
    [
      projects,
      templates,
      comments,
      files,
      activity,
      dialog,
      closeDialog,
      openNewProject,
      openNewTask,
      openTask,
      openNewTemplate,
      createProject,
      duplicateProject,
      addTask,
      updateTask,
      addComment,
      addFile,
      createTemplate,
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
