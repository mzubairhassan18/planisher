"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ActivityItem,
  BudgetLine,
  CommentAttachment,
  CostEntry,
  Project,
  ProjectFile,
  ProjectTask,
  TaskComment,
} from "@/lib/types";

export const attachmentBucket = "project-attachments";

export interface PersistenceContext {
  actorId: string;
  currency: string;
  supabase: SupabaseClient;
  timezone: string;
  workspaceId: string;
}

function fail(error: { message: string } | null, action: string) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

function safeFileName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(-120) || "upload";
}

function attachmentKind(contentType: string) {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.startsWith("video/")) return "video";
  return "document";
}

function makeStoragePath(
  context: PersistenceContext,
  projectId: string,
  section: "covers" | "comments" | "files",
  fileName: string,
  nestedId?: string,
) {
  const middle = nestedId ? `${section}/${nestedId}` : section;
  return `${context.workspaceId}/${projectId}/${middle}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
}

async function signedUrl(
  supabase: SupabaseClient,
  path: string,
  expiresIn = 60 * 60,
) {
  const result = await supabase.storage
    .from(attachmentBucket)
    .createSignedUrl(path, expiresIn);
  fail(result.error, "Could not create a private file URL");
  if (!result.data?.signedUrl) {
    throw new Error("Could not create a private file URL.");
  }
  return result.data.signedUrl;
}

async function uploadAttachment({
  commentId,
  context,
  file,
  path,
  projectId,
  taskId,
}: {
  commentId?: string;
  context: PersistenceContext;
  file: File;
  path: string;
  projectId: string;
  taskId?: string;
}) {
  const upload = await context.supabase.storage
    .from(attachmentBucket)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  fail(upload.error, `Could not upload ${file.name}`);

  const id = crypto.randomUUID();
  const insert = await context.supabase.from("attachments").insert({
    id,
    workspace_id: context.workspaceId,
    project_id: projectId,
    task_id: taskId ?? null,
    comment_id: commentId ?? null,
    uploaded_by: context.actorId,
    kind: attachmentKind(file.type),
    bucket: attachmentBucket,
    storage_path: path,
    file_name: file.name,
    content_type: file.type || "application/octet-stream",
    size_bytes: file.size,
  });
  if (insert.error) {
    await context.supabase.storage.from(attachmentBucket).remove([path]);
    fail(insert.error, `Could not save ${file.name}`);
  }

  return { id, url: await signedUrl(context.supabase, path) };
}

export async function recordActivity(
  context: PersistenceContext,
  item: ActivityItem,
) {
  const result = await context.supabase.rpc("write_audit_event", {
    p_workspace_id: context.workspaceId,
    p_project_id: item.projectId,
    p_action: item.action,
    p_entity_type: item.targetType ?? "project",
    p_entity_id:
      item.commentId ?? item.taskId ?? item.projectId ?? null,
    p_summary: item.detail,
    p_metadata: {
      taskId: item.taskId ?? null,
      commentId: item.commentId ?? null,
    },
  });
  if (result.error) {
    console.warn("Planisher audit event was not persisted", result.error.message);
  }
}

function projectRow(
  context: PersistenceContext,
  project: Project,
  kind: "project" | "template",
  sourceProjectId?: string,
) {
  return {
    id: project.id,
    workspace_id: context.workspaceId,
    kind,
    source_project_id: sourceProjectId ?? null,
    name: project.name,
    code: project.code,
    description: project.description,
    location: project.location,
    lifecycle: "active",
    start_date: project.startDate,
    end_date: project.endDate,
    timezone: context.timezone,
    currency: context.currency,
    created_by: context.actorId,
  };
}

function taskRows(context: PersistenceContext, tasks: ProjectTask[]) {
  return tasks.map((task) => ({
    id: task.id,
    workspace_id: context.workspaceId,
    project_id: task.projectId,
    parent_task_id: task.parentId ?? null,
    type: task.type,
    title: task.title,
    description: task.description ?? "",
    priority: "normal",
    start_date: task.startDate,
    end_date: task.endDate,
    progress: task.progress,
    sort_order: task.sortOrder,
    created_by: context.actorId,
    completed_at: task.progress === 100 ? new Date().toISOString() : null,
  }));
}

export async function persistProjectBundle({
  activity,
  baselineBudget,
  context,
  coverFile,
  kind = "project",
  project,
  sourceProjectId,
}: {
  activity: ActivityItem;
  baselineBudget?: BudgetLine;
  context: PersistenceContext;
  coverFile?: File;
  kind?: "project" | "template";
  project: Project;
  sourceProjectId?: string;
}) {
  const insertedPaths: string[] = [];
  const projectUserIds = Array.from(
    new Set([context.actorId, ...project.teamIds]),
  );
  const bundle = await context.supabase.rpc("create_project_bundle", {
    p_payload: {
      project: projectRow(context, project, kind, sourceProjectId),
      project_members: projectUserIds.map((userId) => ({
        id: crypto.randomUUID(),
        user_id: userId,
        role: userId === context.actorId ? "project_manager" : "contributor",
        can_view_costs: userId === context.actorId,
      })),
      tasks: taskRows(context, project.tasks),
      task_assignees: project.tasks.flatMap((task) =>
        task.assigneeIds.map((userId) => ({
          id: crypto.randomUUID(),
          task_id: task.id,
          user_id: userId,
        })),
      ),
      dependencies: project.dependencies.map((dependency) => ({
        id: dependency.id,
        predecessor_task_id: dependency.sourceTaskId,
        successor_task_id: dependency.targetTaskId,
      })),
      baseline_budget: baselineBudget
        ? {
            id: baselineBudget.id,
            category: baselineBudget.category,
            description: baselineBudget.description,
            planned_minor: baselineBudget.plannedMinor,
          }
        : null,
    },
  });
  fail(bundle.error, "Could not create the project and its schedule");

  try {
    let coverImage: Project["coverImage"];
    if (coverFile) {
      const path = makeStoragePath(context, project.id, "covers", coverFile.name);
      insertedPaths.push(path);
      const uploaded = await uploadAttachment({
        context,
        file: coverFile,
        path,
        projectId: project.id,
      });
      coverImage = {
        name: coverFile.name,
        type: coverFile.type || "image/jpeg",
        sizeBytes: coverFile.size,
        url: uploaded.url,
      };
    }

    await recordActivity(context, activity);
    return coverImage;
  } catch (error) {
    await context.supabase.from("projects").delete().eq("id", project.id);
    if (insertedPaths.length) {
      await context.supabase.storage.from(attachmentBucket).remove(insertedPaths);
    }
    throw error;
  }
}

export async function persistDeleteProject(
  context: PersistenceContext,
  projectId: string,
) {
  const attachmentResult = await context.supabase
    .from("attachments")
    .select("storage_path")
    .eq("project_id", projectId);
  fail(attachmentResult.error, "Could not inspect project files");
  const result = await context.supabase
    .from("projects")
    .delete()
    .eq("workspace_id", context.workspaceId)
    .eq("id", projectId)
    .select("id")
    .single();
  fail(result.error, "Could not delete the project");
  const paths = (attachmentResult.data ?? []).map((row) => row.storage_path);
  if (paths.length) {
    await context.supabase.storage.from(attachmentBucket).remove(paths);
  }
}

export async function persistTask(
  context: PersistenceContext,
  task: ProjectTask,
  activity: ActivityItem,
) {
  const result = await context.supabase.from("tasks").insert(taskRows(context, [task]));
  fail(result.error, "Could not add the task");
  if (task.assigneeIds.length) {
    const assignees = await context.supabase.from("task_assignees").insert(
      task.assigneeIds.map((userId) => ({
        id: crypto.randomUUID(),
        workspace_id: context.workspaceId,
        project_id: task.projectId,
        task_id: task.id,
        user_id: userId,
      })),
    );
    if (assignees.error) {
      await context.supabase.from("tasks").delete().eq("id", task.id);
      fail(assignees.error, "Could not assign the task");
    }
  }
  await recordActivity(context, activity);
}

export async function persistTaskUpdate(
  context: PersistenceContext,
  projectId: string,
  taskId: string,
  patch: Partial<
    Pick<
      ProjectTask,
      "progress" | "title" | "description" | "startDate" | "endDate" | "assigneeIds"
    >
  >,
  activity?: ActivityItem,
  previousAssigneeIds: string[] = [],
) {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.progress !== undefined) {
    row.progress = patch.progress;
    row.completed_at = patch.progress === 100 ? new Date().toISOString() : null;
  }
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.startDate !== undefined) row.start_date = patch.startDate;
  if (patch.endDate !== undefined) row.end_date = patch.endDate;

  const result = await context.supabase
    .from("tasks")
    .update(row)
    .eq("project_id", projectId)
    .eq("id", taskId)
    .select("id")
    .single();
  fail(result.error, "Could not update the task");

  if (patch.assigneeIds !== undefined) {
    const removed = await context.supabase
      .from("task_assignees")
      .delete()
      .eq("project_id", projectId)
      .eq("task_id", taskId);
    fail(removed.error, "Could not update task assignees");
    if (patch.assigneeIds.length) {
      const assigned = await context.supabase.from("task_assignees").insert(
        patch.assigneeIds.map((userId) => ({
          id: crypto.randomUUID(),
          workspace_id: context.workspaceId,
          project_id: projectId,
          task_id: taskId,
          user_id: userId,
        })),
      );
      if (assigned.error && previousAssigneeIds.length) {
        await context.supabase.from("task_assignees").insert(
          previousAssigneeIds.map((userId) => ({
            id: crypto.randomUUID(),
            workspace_id: context.workspaceId,
            project_id: projectId,
            task_id: taskId,
            user_id: userId,
          })),
        );
      }
      fail(assigned.error, "Could not update task assignees");
    }
  }
  await context.supabase
    .from("projects")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", projectId);
  if (activity) await recordActivity(context, activity);
}

export async function persistComment({
  activity,
  comment,
  context,
  mediaFiles,
}: {
  activity: ActivityItem;
  comment: TaskComment;
  context: PersistenceContext;
  mediaFiles: File[];
}) {
  const result = await context.supabase.from("comments").insert({
    id: comment.id,
    workspace_id: context.workspaceId,
    project_id: comment.projectId,
    task_id: comment.taskId,
    author_id: context.actorId,
    kind: comment.kind === "issue" ? "problem" : "comment",
    problem_state: comment.kind === "issue" ? "open" : null,
    body: comment.body,
  });
  fail(result.error, "Could not add the update");

  const uploadedPaths: string[] = [];
  try {
    const attachments: CommentAttachment[] = [];
    for (const file of mediaFiles) {
      const path = makeStoragePath(
        context,
        comment.projectId,
        "comments",
        file.name,
        comment.id,
      );
      uploadedPaths.push(path);
      const uploaded = await uploadAttachment({
        commentId: comment.id,
        context,
        file,
        path,
        projectId: comment.projectId,
        taskId: comment.taskId,
      });
      attachments.push({
        id: uploaded.id,
        name: file.name,
        type: file.type || "application/octet-stream",
        sizeBytes: file.size,
        url: uploaded.url,
      });
    }
    await recordActivity(context, activity);
    return attachments;
  } catch (error) {
    await context.supabase.from("comments").delete().eq("id", comment.id);
    if (uploadedPaths.length) {
      await context.supabase.storage.from(attachmentBucket).remove(uploadedPaths);
    }
    throw error;
  }
}

export async function persistFile(
  context: PersistenceContext,
  projectId: string,
  file: File,
  activity: ActivityItem,
): Promise<ProjectFile> {
  const path = makeStoragePath(context, projectId, "files", file.name);
  const uploaded = await uploadAttachment({ context, file, path, projectId });
  await recordActivity(context, activity);
  return {
    id: uploaded.id,
    projectId,
    name: file.name,
    sizeBytes: file.size,
    type: file.type || "application/octet-stream",
    url: uploaded.url,
    uploadedAt: new Date().toISOString(),
  };
}

export async function persistBudgetLine(
  context: PersistenceContext,
  line: BudgetLine,
  activity: ActivityItem,
) {
  const result = await context.supabase.from("budget_lines").insert({
    id: line.id,
    workspace_id: context.workspaceId,
    project_id: line.projectId,
    task_id: line.taskId ?? null,
    cost_code: `AUTO-${line.id.slice(0, 8).toUpperCase()}`,
    category: line.category,
    description: line.description,
    planned_minor: line.plannedMinor,
    currency: context.currency,
    created_by: context.actorId,
  });
  fail(result.error, "Could not add the budget line");
  await recordActivity(context, activity);
}

export async function persistCostEntry(
  context: PersistenceContext,
  entry: CostEntry,
  activity: ActivityItem,
) {
  const result = await context.supabase.from("cost_entries").insert({
    id: entry.id,
    workspace_id: context.workspaceId,
    project_id: entry.projectId,
    budget_line_id: entry.budgetLineId ?? null,
    task_id: entry.taskId ?? null,
    type: entry.type,
    amount_minor: entry.amountMinor,
    currency: context.currency,
    vendor: entry.vendor,
    reference: "",
    occurred_on: entry.occurredOn,
    note: entry.description,
    created_by: context.actorId,
  });
  fail(result.error, "Could not record the cost");
  await recordActivity(context, activity);
}
