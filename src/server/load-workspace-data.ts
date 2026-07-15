import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ActivityItem,
  BudgetLine,
  CommentAttachment,
  CostEntry,
  PersistedWorkspaceStore,
  Project,
  ProjectFile,
  ProjectTask,
  ProjectTemplate,
  TaskComment,
  TaskDependency,
  TeamMember,
} from "@/lib/types";

type JsonObject = Record<string, unknown>;

function requireData<T>(
  result: { data: T | null; error: { message: string } | null },
  label: string,
): T {
  if (result.error) {
    throw new Error(`Could not load ${label}: ${result.error.message}`);
  }
  return result.data ?? ([] as T);
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "PU"
  );
}

function memberColor(index: number) {
  const colors = ["#1f6b4f", "#3b6f8f", "#8a5b35", "#6c5a93", "#a45d45"];
  return colors[index % colors.length];
}

function asMetadata(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

export async function loadWorkspaceData({
  currentUser,
  starterTemplates,
  supabase,
  workspaceId,
}: {
  currentUser: TeamMember;
  starterTemplates: ProjectTemplate[];
  supabase: SupabaseClient;
  workspaceId: string;
}): Promise<PersistedWorkspaceStore> {
  const [
    projectResult,
    projectMemberResult,
    taskResult,
    assigneeResult,
    dependencyResult,
    commentResult,
    attachmentResult,
    budgetResult,
    costResult,
    auditResult,
    workspaceMemberResult,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, kind, source_project_id, name, code, description, location, lifecycle, start_date, end_date, timezone, currency, created_at, updated_at",
      )
      .eq("workspace_id", workspaceId)
      .neq("lifecycle", "archived")
      .order("updated_at", { ascending: false }),
    supabase
      .from("project_members")
      .select("project_id, user_id")
      .eq("workspace_id", workspaceId),
    supabase
      .from("tasks")
      .select(
        "id, project_id, parent_task_id, type, title, description, start_date, end_date, progress, sort_order, updated_at",
      )
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase
      .from("task_assignees")
      .select("task_id, user_id")
      .eq("workspace_id", workspaceId),
    supabase
      .from("task_dependencies")
      .select("id, project_id, predecessor_task_id, successor_task_id, type")
      .eq("workspace_id", workspaceId),
    supabase
      .from("comments")
      .select(
        "id, project_id, task_id, author_id, kind, body, created_at, deleted_at",
      )
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at"),
    supabase
      .from("attachments")
      .select(
        "id, project_id, task_id, comment_id, bucket, storage_path, file_name, content_type, size_bytes, created_at, deleted_at",
      )
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at"),
    supabase
      .from("budget_lines")
      .select(
        "id, project_id, task_id, category, description, planned_minor, created_at, deleted_at",
      )
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at"),
    supabase
      .from("cost_entries")
      .select(
        "id, project_id, task_id, budget_line_id, type, amount_minor, vendor, reference, occurred_on, note, created_at, voided_at",
      )
      .eq("workspace_id", workspaceId)
      .is("voided_at", null)
      .order("occurred_on"),
    supabase
      .from("audit_events")
      .select(
        "id, project_id, actor_user_id, action, entity_type, entity_id, summary, metadata, occurred_at",
      )
      .eq("workspace_id", workspaceId)
      .order("occurred_at", { ascending: false })
      .limit(500),
    supabase
      .from("workspace_members")
      .select("user_id, role, status")
      .eq("workspace_id", workspaceId)
      .eq("status", "active"),
  ]);

  const projectRows = requireData(projectResult, "projects");
  const projectMemberRows = requireData(projectMemberResult, "project members");
  const taskRows = requireData(taskResult, "tasks");
  const assigneeRows = requireData(assigneeResult, "task assignees");
  const dependencyRows = requireData(dependencyResult, "dependencies");
  const commentRows = requireData(commentResult, "comments");
  const attachmentRows = requireData(attachmentResult, "attachments");
  const budgetRows = requireData(budgetResult, "budget lines");
  const costRows = requireData(costResult, "cost entries");
  const auditRows = requireData(auditResult, "activity");
  const workspaceMemberRows = requireData(workspaceMemberResult, "workspace members");

  const memberIds = workspaceMemberRows.map((row) => row.user_id);
  const profileResult = memberIds.length
    ? await supabase.from("profiles").select("id, name, job_role").in("id", memberIds)
    : { data: [], error: null };
  const profileRows = requireData(profileResult, "member profiles");
  const profileById = new Map(profileRows.map((profile) => [profile.id, profile]));
  const members: TeamMember[] = workspaceMemberRows.map((membership, index) => {
    const profile = profileById.get(membership.user_id);
    const name =
      membership.user_id === currentUser.id
        ? currentUser.name
        : profile?.name || "Workspace member";
    return {
      id: membership.user_id,
      name,
      initials: initials(name),
      role: profile?.job_role || membership.role.replaceAll("_", " "),
      color: memberColor(index),
    };
  });
  if (!members.some((member) => member.id === currentUser.id)) {
    members.unshift(currentUser);
  }

  const signedUrls = new Map<string, string>();
  await Promise.all(
    attachmentRows.map(async (attachment) => {
      const { data } = await supabase.storage
        .from(attachment.bucket)
        .createSignedUrl(attachment.storage_path, 60 * 60);
      if (data?.signedUrl) signedUrls.set(attachment.id, data.signedUrl);
    }),
  );

  const assigneesByTask = new Map<string, string[]>();
  assigneeRows.forEach((row) => {
    assigneesByTask.set(row.task_id, [
      ...(assigneesByTask.get(row.task_id) ?? []),
      row.user_id,
    ]);
  });

  const tasksByProject = new Map<string, ProjectTask[]>();
  taskRows.forEach((row) => {
    const task: ProjectTask = {
      id: row.id,
      projectId: row.project_id,
      parentId: row.parent_task_id ?? undefined,
      type: row.type,
      title: row.title,
      description: row.description || "",
      startDate: row.start_date,
      endDate: row.end_date,
      progress: row.progress,
      assigneeIds: assigneesByTask.get(row.id) ?? [],
      sortOrder: row.sort_order,
    };
    tasksByProject.set(row.project_id, [
      ...(tasksByProject.get(row.project_id) ?? []),
      task,
    ]);
  });

  const dependenciesByProject = new Map<string, TaskDependency[]>();
  dependencyRows.forEach((row) => {
    dependenciesByProject.set(row.project_id, [
      ...(dependenciesByProject.get(row.project_id) ?? []),
      {
        id: row.id,
        sourceTaskId: row.predecessor_task_id,
        targetTaskId: row.successor_task_id,
        type: "finish_to_start",
      },
    ]);
  });

  const budgetLines: BudgetLine[] = budgetRows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    taskId: row.task_id ?? undefined,
    category: row.category,
    description: row.description,
    plannedMinor: Number(row.planned_minor),
    createdAt: row.created_at,
  }));
  const costEntries: CostEntry[] = costRows
    .filter((row) => row.type === "commitment" || row.type === "actual")
    .map((row) => ({
      id: row.id,
      projectId: row.project_id,
      taskId: row.task_id ?? undefined,
      budgetLineId: row.budget_line_id ?? undefined,
      type: row.type as CostEntry["type"],
      description: row.note || row.reference || "Cost entry",
      vendor: row.vendor,
      amountMinor: Number(row.amount_minor),
      occurredOn: row.occurred_on,
      createdAt: row.created_at,
    }));

  const projectMemberIds = new Map<string, string[]>();
  projectMemberRows.forEach((row) => {
    projectMemberIds.set(row.project_id, [
      ...(projectMemberIds.get(row.project_id) ?? []),
      row.user_id,
    ]);
  });

  const projectModels = projectRows.map((row) => {
    const projectBudgetLines = budgetLines.filter((line) => line.projectId === row.id);
    const projectCosts = costEntries.filter((entry) => entry.projectId === row.id);
    const cover = attachmentRows.find(
      (attachment) =>
        attachment.project_id === row.id &&
        !attachment.task_id &&
        !attachment.comment_id &&
        attachment.storage_path.includes("/covers/"),
    );
    const project: Project = {
      id: row.id,
      code: row.code,
      name: row.name,
      location: row.location,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      budgetMinor: projectBudgetLines.reduce(
        (total, line) => total + line.plannedMinor,
        0,
      ),
      spentMinor: projectCosts
        .filter((entry) => entry.type === "actual")
        .reduce((total, entry) => total + entry.amountMinor, 0),
      coverImage:
        cover && signedUrls.get(cover.id)
          ? {
              name: cover.file_name,
              type: cover.content_type,
              sizeBytes: Number(cover.size_bytes),
              url: signedUrls.get(cover.id)!,
            }
          : undefined,
      teamIds: projectMemberIds.get(row.id) ?? [currentUser.id],
      tasks: tasksByProject.get(row.id) ?? [],
      dependencies: dependenciesByProject.get(row.id) ?? [],
      updatedAt: row.updated_at,
    };
    return { project, row };
  });

  const projects = projectModels
    .filter(({ row }) => row.kind === "project")
    .map(({ project }) => project);
  const workspaceTemplates: ProjectTemplate[] = projectModels
    .filter(({ row }) => row.kind === "template")
    .map(({ project, row }) => ({
      id: project.id,
      name: project.name,
      sourceProjectId: row.source_project_id ?? undefined,
      description: project.description,
      tasks: project.tasks.map((task) => ({ ...task, progress: 0 })),
      dependencies: project.dependencies,
      createdAt: row.created_at,
    }));

  const attachmentByComment = new Map<string, CommentAttachment[]>();
  attachmentRows.forEach((attachment) => {
    if (!attachment.comment_id) return;
    const url = signedUrls.get(attachment.id);
    if (!url) return;
    attachmentByComment.set(attachment.comment_id, [
      ...(attachmentByComment.get(attachment.comment_id) ?? []),
      {
        id: attachment.id,
        name: attachment.file_name,
        type: attachment.content_type,
        sizeBytes: Number(attachment.size_bytes),
        url,
      },
    ]);
  });
  const comments: TaskComment[] = commentRows
    .filter((row) => Boolean(row.task_id))
    .map((row) => ({
      id: row.id,
      projectId: row.project_id,
      taskId: row.task_id!,
      authorId: row.author_id,
      kind: row.kind === "problem" ? "issue" : "comment",
      body: row.body,
      attachments: attachmentByComment.get(row.id) ?? [],
      createdAt: row.created_at,
    }));

  const files: ProjectFile[] = attachmentRows
    .filter(
      (attachment) =>
        !attachment.task_id &&
        !attachment.comment_id &&
        !attachment.storage_path.includes("/covers/"),
    )
    .map((attachment) => ({
      id: attachment.id,
      projectId: attachment.project_id,
      name: attachment.file_name,
      sizeBytes: Number(attachment.size_bytes),
      type: attachment.content_type,
      url: signedUrls.get(attachment.id),
      uploadedAt: attachment.created_at,
    }));

  const activity: ActivityItem[] = auditRows
    .filter((row) => Boolean(row.project_id && row.actor_user_id))
    .map((row) => {
      const metadata = asMetadata(row.metadata);
      const targetType = ["project", "task", "comment", "budget", "file"].includes(
        row.entity_type,
      )
        ? (row.entity_type as ActivityItem["targetType"])
        : undefined;
      return {
        id: row.id,
        projectId: row.project_id!,
        actorId: row.actor_user_id!,
        action: row.action,
        detail: row.summary,
        targetType,
        taskId: typeof metadata.taskId === "string" ? metadata.taskId : undefined,
        commentId:
          typeof metadata.commentId === "string" ? metadata.commentId : undefined,
        occurredAt: row.occurred_at,
      };
    });

  return {
    projects,
    templates: [...workspaceTemplates, ...starterTemplates],
    comments,
    files,
    activity,
    budgetLines,
    costEntries,
    members,
  };
}
