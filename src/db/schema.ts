import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const workspaceRole = pgEnum("workspace_role", [
  "owner",
  "admin",
  "member",
  "external",
]);
export const workspaceType = pgEnum("workspace_type", [
  "personal",
  "builder",
  "contractor",
  "company",
]);
export const memberStatus = pgEnum("member_status", [
  "invited",
  "active",
  "disabled",
]);
export const projectRole = pgEnum("project_role", [
  "project_manager",
  "scheduler",
  "finance",
  "contributor",
  "viewer",
]);
export const projectKind = pgEnum("project_kind", ["project", "template"]);
export const projectLifecycle = pgEnum("project_lifecycle", [
  "draft",
  "active",
  "on_hold",
  "archived",
]);
export const taskType = pgEnum("task_type", ["task", "summary", "milestone"]);
export const taskPriority = pgEnum("task_priority", [
  "low",
  "normal",
  "high",
  "critical",
]);
export const dependencyType = pgEnum("dependency_type", ["FS", "SS", "FF", "SF"]);
export const commentKind = pgEnum("comment_kind", ["comment", "problem"]);
export const problemState = pgEnum("problem_state", ["open", "resolved"]);
export const attachmentKind = pgEnum("attachment_kind", [
  "image",
  "audio",
  "video",
  "document",
]);
export const costEntryType = pgEnum("cost_entry_type", [
  "commitment",
  "actual",
  "forecast_adjustment",
]);
export const planKey = pgEnum("plan_key", [
  "personal",
  "builder",
  "company",
  "business",
]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  jobRole: text("job_role"),
  avatarUrl: text("avatar_url"),
  locale: text("locale").default("en").notNull(),
  ...timestamps,
}).enableRLS();

export const starterTemplates = pgTable(
  "starter_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    description: text("description").default("").notNull(),
    estimatedDurationDays: integer("estimated_duration_days").notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    version: integer("version").default(1).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("starter_templates_slug_unique").on(table.slug),
    check(
      "starter_templates_duration_check",
      sql`${table.estimatedDurationDays} > 0`,
    ),
    check("starter_templates_version_check", sql`${table.version} > 0`),
  ],
).enableRLS();

export const starterTemplateTasks = pgTable(
  "starter_template_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => starterTemplates.id, { onDelete: "cascade" }),
    taskKey: text("task_key").notNull(),
    phase: text("phase").notNull(),
    type: taskType("type").default("task").notNull(),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    startOffsetDays: integer("start_offset_days").notNull(),
    durationDays: integer("duration_days").notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("starter_template_tasks_key_unique").on(
      table.templateId,
      table.taskKey,
    ),
    uniqueIndex("starter_template_tasks_sort_unique").on(
      table.templateId,
      table.sortOrder,
    ),
    index("starter_template_tasks_template_sort_idx").on(
      table.templateId,
      table.sortOrder,
    ),
    check(
      "starter_template_tasks_offset_check",
      sql`${table.startOffsetDays} >= 0`,
    ),
    check(
      "starter_template_tasks_duration_check",
      sql`${table.durationDays} > 0`,
    ),
    check("starter_template_tasks_sort_check", sql`${table.sortOrder} >= 0`),
  ],
).enableRLS();

export const starterTemplateDependencies = pgTable(
  "starter_template_dependencies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => starterTemplates.id, { onDelete: "cascade" }),
    predecessorTaskId: uuid("predecessor_task_id")
      .notNull()
      .references(() => starterTemplateTasks.id, { onDelete: "cascade" }),
    successorTaskId: uuid("successor_task_id")
      .notNull()
      .references(() => starterTemplateTasks.id, { onDelete: "cascade" }),
    type: dependencyType("type").default("FS").notNull(),
    lagWorkingDays: integer("lag_working_days").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("starter_template_dependencies_unique").on(
      table.predecessorTaskId,
      table.successorTaskId,
      table.type,
    ),
    index("starter_template_dependencies_template_idx").on(table.templateId),
    check(
      "starter_template_dependencies_no_self_check",
      sql`${table.predecessorTaskId} <> ${table.successorTaskId}`,
    ),
  ],
).enableRLS();

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    type: workspaceType("type").default("personal").notNull(),
    estimatedTeamSize: integer("estimated_team_size").default(1).notNull(),
    defaultTimezone: text("default_timezone").notNull(),
    defaultCurrency: text("default_currency").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("workspaces_slug_unique").on(table.slug),
    check(
      "workspaces_estimated_team_size_check",
      sql`${table.estimatedTeamSize} between 1 and 1000`,
    ),
  ],
).enableRLS();

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: workspaceRole("role").notNull(),
    status: memberStatus("status").default("active").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("workspace_members_workspace_user_unique").on(
      table.workspaceId,
      table.userId,
    ),
    index("workspace_members_user_idx").on(table.userId, table.status),
  ],
).enableRLS();

export const workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: workspaceRole("role").default("member").notNull(),
    tokenHash: text("token_hash").notNull(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("workspace_invitations_token_unique").on(table.tokenHash),
    index("workspace_invitations_workspace_email_idx").on(
      table.workspaceId,
      table.email,
    ),
  ],
).enableRLS();

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    kind: projectKind("kind").default("project").notNull(),
    sourceProjectId: uuid("source_project_id").references(
      (): AnyPgColumn => projects.id,
      { onDelete: "set null" },
    ),
    name: text("name").notNull(),
    code: text("code").notNull(),
    description: text("description").default("").notNull(),
    location: text("location").default("").notNull(),
    lifecycle: projectLifecycle("lifecycle").default("active").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    timezone: text("timezone").notNull(),
    currency: text("currency").notNull(),
    workingWeek: jsonb("working_week")
      .$type<number[]>()
      .default([1, 2, 3, 4, 5])
      .notNull(),
    version: integer("version").default(1).notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("projects_workspace_code_unique").on(
      table.workspaceId,
      table.code,
    ),
    index("projects_workspace_kind_lifecycle_idx").on(
      table.workspaceId,
      table.kind,
      table.lifecycle,
    ),
    check("projects_date_range_check", sql`${table.endDate} >= ${table.startDate}`),
    check("projects_version_check", sql`${table.version} > 0`),
  ],
).enableRLS();

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: projectRole("role").notNull(),
    canViewCosts: boolean("can_view_costs").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("project_members_project_user_unique").on(
      table.projectId,
      table.userId,
    ),
    index("project_members_workspace_user_idx").on(
      table.workspaceId,
      table.userId,
    ),
  ],
).enableRLS();

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    parentTaskId: uuid("parent_task_id").references(
      (): AnyPgColumn => tasks.id,
      { onDelete: "set null" },
    ),
    type: taskType("type").default("task").notNull(),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    priority: taskPriority("priority").default("normal").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    progress: integer("progress").default(0).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    version: integer("version").default(1).notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("tasks_project_parent_sort_idx").on(
      table.projectId,
      table.parentTaskId,
      table.sortOrder,
    ),
    index("tasks_project_dates_idx").on(
      table.projectId,
      table.startDate,
      table.endDate,
    ),
    check("tasks_date_range_check", sql`${table.endDate} >= ${table.startDate}`),
    check("tasks_progress_check", sql`${table.progress} between 0 and 100`),
    check("tasks_version_check", sql`${table.version} > 0`),
  ],
).enableRLS();

export const taskAssignees = pgTable(
  "task_assignees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("task_assignees_task_user_unique").on(table.taskId, table.userId),
    index("task_assignees_user_idx").on(table.workspaceId, table.userId),
  ],
).enableRLS();

export const taskDependencies = pgTable(
  "task_dependencies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    predecessorTaskId: uuid("predecessor_task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    successorTaskId: uuid("successor_task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    type: dependencyType("type").default("FS").notNull(),
    lagWorkingDays: integer("lag_working_days").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("task_dependencies_unique").on(
      table.predecessorTaskId,
      table.successorTaskId,
      table.type,
    ),
    index("task_dependencies_project_idx").on(table.projectId),
    check(
      "task_dependencies_no_self_check",
      sql`${table.predecessorTaskId} <> ${table.successorTaskId}`,
    ),
  ],
).enableRLS();

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    kind: commentKind("kind").default("comment").notNull(),
    problemState: problemState("problem_state"),
    body: text("body").default("").notNull(),
    resolvedBy: uuid("resolved_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("comments_task_created_idx").on(table.taskId, table.createdAt),
    index("comments_project_created_idx").on(table.projectId, table.createdAt),
    check(
      "comments_problem_state_check",
      sql`(${table.kind} = 'problem' and ${table.problemState} is not null) or (${table.kind} = 'comment' and ${table.problemState} is null)`,
    ),
  ],
).enableRLS();

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    commentId: uuid("comment_id").references(() => comments.id, {
      onDelete: "cascade",
    }),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    kind: attachmentKind("kind").notNull(),
    bucket: text("bucket").default("project-attachments").notNull(),
    storagePath: text("storage_path").notNull(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    checksum: text("checksum"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("attachments_bucket_path_unique").on(
      table.bucket,
      table.storagePath,
    ),
    index("attachments_project_task_idx").on(table.projectId, table.taskId),
    check("attachments_size_check", sql`${table.sizeBytes} > 0`),
  ],
).enableRLS();

export const budgetLines = pgTable(
  "budget_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    costCode: text("cost_code").notNull(),
    category: text("category").notNull(),
    description: text("description").default("").notNull(),
    plannedMinor: bigint("planned_minor", { mode: "number" }).default(0).notNull(),
    currency: text("currency").notNull(),
    version: integer("version").default(1).notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("budget_lines_project_code_unique").on(
      table.projectId,
      table.costCode,
    ),
    index("budget_lines_workspace_project_idx").on(
      table.workspaceId,
      table.projectId,
    ),
    check("budget_lines_planned_check", sql`${table.plannedMinor} >= 0`),
    check("budget_lines_version_check", sql`${table.version} > 0`),
  ],
).enableRLS();

export const costEntries = pgTable(
  "cost_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    budgetLineId: uuid("budget_line_id").references(() => budgetLines.id, {
      onDelete: "set null",
    }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    type: costEntryType("type").notNull(),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    currency: text("currency").notNull(),
    vendor: text("vendor").default("").notNull(),
    reference: text("reference").default("").notNull(),
    occurredOn: date("occurred_on", { mode: "string" }).notNull(),
    note: text("note").default("").notNull(),
    version: integer("version").default(1).notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("cost_entries_project_date_idx").on(table.projectId, table.occurredOn),
    index("cost_entries_budget_line_idx").on(table.budgetLineId),
    check(
      "cost_entries_amount_check",
      sql`${table.type} = 'forecast_adjustment' or ${table.amountMinor} >= 0`,
    ),
    check("cost_entries_version_check", sql`${table.version} > 0`),
  ],
).enableRLS();

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    actorUserId: uuid("actor_user_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    summary: text("summary").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    metadata: jsonb("metadata"),
    requestId: text("request_id"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_events_workspace_time_idx").on(
      table.workspaceId,
      table.occurredAt,
    ),
    index("audit_events_project_time_idx").on(table.projectId, table.occurredAt),
  ],
).enableRLS();

export const workspaceSubscriptions = pgTable(
  "workspace_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    plan: planKey("plan").default("personal").notNull(),
    status: subscriptionStatus("status").default("active").notNull(),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    providerCustomerId: text("provider_customer_id"),
    providerSubscriptionId: text("provider_subscription_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("workspace_subscriptions_workspace_unique").on(table.workspaceId),
  ],
).enableRLS();

export type Profile = typeof profiles.$inferSelect;
export type StarterTemplate = typeof starterTemplates.$inferSelect;
export type StarterTemplateTask = typeof starterTemplateTasks.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
