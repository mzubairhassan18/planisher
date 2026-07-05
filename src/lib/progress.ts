import type { Project, ProjectTask, ScheduleStatus } from "@/lib/types";

const DAY_IN_MS = 86_400_000;

function toUtcDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function durationWeight(task: ProjectTask) {
  if (task.type === "milestone") return 1;

  const duration =
    Math.floor(
      (toUtcDate(task.endDate).getTime() - toUtcDate(task.startDate).getTime()) /
        DAY_IN_MS,
    ) + 1;

  return Math.max(1, duration);
}

export function getLeafTasks(tasks: ProjectTask[]) {
  const parentIds = new Set(
    tasks.map((task) => task.parentId).filter((id): id is string => Boolean(id)),
  );

  return tasks.filter((task) => !parentIds.has(task.id) && task.type !== "summary");
}

export function calculateProjectProgress(tasks: ProjectTask[]) {
  const leafTasks = getLeafTasks(tasks);
  const totalWeight = leafTasks.reduce(
    (sum, task) => sum + durationWeight(task),
    0,
  );

  if (!totalWeight) return 0;

  const weightedProgress = leafTasks.reduce(
    (sum, task) => sum + task.progress * durationWeight(task),
    0,
  );

  return Math.round(weightedProgress / totalWeight);
}

export function getTaskScheduleStatus(
  task: ProjectTask,
  today = new Date(),
): ScheduleStatus {
  if (task.progress >= 100) return "completed";

  const todayKey = today.toISOString().slice(0, 10);
  if (task.endDate < todayKey) return "delayed";
  if (task.progress === 0 && task.startDate > todayKey) return "not_started";
  return "on_time";
}

export function getProjectScheduleStatus(
  project: Project,
  today = new Date(),
): ScheduleStatus {
  const leafTasks = getLeafTasks(project.tasks);
  const progress = calculateProjectProgress(project.tasks);

  if (leafTasks.length === 0) return "not_started";
  if (progress >= 100) return "completed";
  if (leafTasks.some((task) => getTaskScheduleStatus(task, today) === "delayed")) {
    return "delayed";
  }

  const todayKey = today.toISOString().slice(0, 10);
  if (
    leafTasks.length > 0 &&
    leafTasks.every((task) => task.progress === 0 && task.startDate > todayKey)
  ) {
    return "not_started";
  }

  return "on_time";
}

export function countTasksByStatus(
  projects: Project[],
  status: ScheduleStatus,
  today = new Date(),
) {
  return projects
    .flatMap((project) => getLeafTasks(project.tasks))
    .filter((task) => getTaskScheduleStatus(task, today) === status).length;
}
