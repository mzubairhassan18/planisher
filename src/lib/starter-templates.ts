import type {
  ProjectTask,
  ProjectTemplate,
  TaskDependency,
  TaskType,
} from "@/lib/types";

const catalogEpoch = "2025-01-06";

interface StarterTaskRow {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  start_offset_days: number;
  duration_days: number;
  sort_order: number;
}

interface StarterDependencyRow {
  id: string;
  predecessor_task_id: string;
  successor_task_id: string;
}

export interface StarterTemplateRow {
  id: string;
  name: string;
  category: string;
  description: string;
  estimated_duration_days: number;
  created_at: string;
  starter_template_tasks: StarterTaskRow[] | null;
  starter_template_dependencies: StarterDependencyRow[] | null;
}

function shiftDate(date: string, offsetDays: number) {
  const shifted = new Date(`${date}T12:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + offsetDays);
  return shifted.toISOString().slice(0, 10);
}

export function mapStarterTemplates(
  rows: StarterTemplateRow[] | null | undefined,
): ProjectTemplate[] {
  return (rows ?? []).map((row) => {
    const tasks: ProjectTask[] = (row.starter_template_tasks ?? [])
      .slice()
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((task) => ({
        id: task.id,
        projectId: row.id,
        type: task.type,
        title: task.title,
        description: task.description,
        startDate: shiftDate(catalogEpoch, task.start_offset_days),
        endDate: shiftDate(
          catalogEpoch,
          task.start_offset_days + task.duration_days - 1,
        ),
        progress: 0,
        assigneeIds: [],
        sortOrder: task.sort_order,
      }));
    const dependencies: TaskDependency[] = (
      row.starter_template_dependencies ?? []
    ).map((dependency) => ({
      id: dependency.id,
      sourceTaskId: dependency.predecessor_task_id,
      targetTaskId: dependency.successor_task_id,
      type: "finish_to_start",
    }));

    return {
      id: row.id,
      name: row.name,
      category: row.category,
      estimatedDurationDays: row.estimated_duration_days,
      isStarter: true,
      description: row.description,
      tasks,
      dependencies,
      createdAt: row.created_at,
    };
  });
}
