export type ScheduleStatus =
  | "not_started"
  | "on_time"
  | "delayed"
  | "completed";

export type TaskType = "task" | "summary" | "milestone";

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  parentId?: string;
  type: TaskType;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  progress: number;
  assigneeIds: string[];
  sortOrder: number;
}

export interface TaskDependency {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  type: "finish_to_start";
}

export interface Project {
  id: string;
  code: string;
  name: string;
  location: string;
  description: string;
  startDate: string;
  endDate: string;
  budgetMinor: number;
  spentMinor: number;
  teamIds: string[];
  tasks: ProjectTask[];
  dependencies: TaskDependency[];
  updatedAt: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  sourceProjectId?: string;
  category?: string;
  estimatedDurationDays?: number;
  isStarter?: boolean;
  description: string;
  tasks: ProjectTask[];
  dependencies: TaskDependency[];
  createdAt: string;
}

export interface CommentAttachment {
  id: string;
  name: string;
  type: string;
  sizeBytes: number;
  url: string;
}

export interface TaskComment {
  id: string;
  projectId: string;
  taskId: string;
  authorId: string;
  kind: "comment" | "issue";
  body: string;
  attachments: CommentAttachment[];
  createdAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  sizeBytes: number;
  type: string;
  uploadedAt: string;
}

export interface ActivityItem {
  id: string;
  projectId: string;
  actorId: string;
  action: string;
  detail: string;
  targetType?: "project" | "task" | "comment" | "budget" | "file";
  taskId?: string;
  commentId?: string;
  occurredAt: string;
}

export interface BudgetLine {
  id: string;
  projectId: string;
  taskId?: string;
  category: string;
  description: string;
  plannedMinor: number;
  createdAt: string;
}

export interface CostEntry {
  id: string;
  projectId: string;
  taskId?: string;
  budgetLineId?: string;
  type: "commitment" | "actual";
  description: string;
  vendor: string;
  amountMinor: number;
  occurredOn: string;
  createdAt: string;
}

export interface LocaleSettings {
  locale: string;
  region: string;
  timezone: string;
  currency: string;
}
