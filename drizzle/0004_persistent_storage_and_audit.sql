-- Durable Planisher media plus append-only audit writes from authenticated clients.
-- All product tables remain protected by the policies in 0001_planisher_rls.sql.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'project-attachments',
  'project-attachments',
  false,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/mpeg',
    'audio/mp4',
    'audio/ogg',
    'audio/wav',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'application/octet-stream',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists planisher_attachments_select on storage.objects;
drop policy if exists planisher_attachments_insert on storage.objects;
drop policy if exists planisher_attachments_update on storage.objects;
drop policy if exists planisher_attachments_delete on storage.objects;

create policy planisher_attachments_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-attachments'
  and (storage.foldername(name))[2] is not null
  and (select private.can_access_project(((storage.foldername(name))[2])::uuid))
);

create policy planisher_attachments_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-attachments'
  and (storage.foldername(name))[1] is not null
  and (storage.foldername(name))[2] is not null
  and (select private.is_workspace_member(((storage.foldername(name))[1])::uuid))
  and (select private.can_access_project(((storage.foldername(name))[2])::uuid))
);

create policy planisher_attachments_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'project-attachments'
  and owner_id = (select auth.uid()::text)
  and (select private.can_access_project(((storage.foldername(name))[2])::uuid))
)
with check (
  bucket_id = 'project-attachments'
  and owner_id = (select auth.uid()::text)
  and (select private.can_access_project(((storage.foldername(name))[2])::uuid))
);

create policy planisher_attachments_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-attachments'
  and (
    owner_id = (select auth.uid()::text)
    or (select private.can_manage_project(((storage.foldername(name))[2])::uuid))
  )
);

create or replace function public.create_project_bundle(p_payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  project_data jsonb := p_payload -> 'project';
  project_id uuid := (p_payload -> 'project' ->> 'id')::uuid;
  workspace_id uuid := (p_payload -> 'project' ->> 'workspace_id')::uuid;
  baseline_data jsonb := p_payload -> 'baseline_budget';
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if not (select private.can_create_project(workspace_id)) then
    raise exception 'Project creation is not allowed in this workspace'
      using errcode = '42501';
  end if;

  insert into public.projects (
    id,
    workspace_id,
    kind,
    source_project_id,
    name,
    code,
    description,
    location,
    lifecycle,
    start_date,
    end_date,
    timezone,
    currency,
    created_by
  )
  values (
    project_id,
    workspace_id,
    (project_data ->> 'kind')::public.project_kind,
    nullif(project_data ->> 'source_project_id', '')::uuid,
    project_data ->> 'name',
    project_data ->> 'code',
    coalesce(project_data ->> 'description', ''),
    coalesce(project_data ->> 'location', ''),
    'active'::public.project_lifecycle,
    (project_data ->> 'start_date')::date,
    (project_data ->> 'end_date')::date,
    project_data ->> 'timezone',
    project_data ->> 'currency',
    (select auth.uid())
  );

  insert into public.project_members (
    id,
    workspace_id,
    project_id,
    user_id,
    role,
    can_view_costs
  )
  select
    member.id,
    workspace_id,
    project_id,
    member.user_id,
    member.role::public.project_role,
    member.can_view_costs
  from jsonb_to_recordset(coalesce(p_payload -> 'project_members', '[]'::jsonb))
    as member(id uuid, user_id uuid, role text, can_view_costs boolean);

  insert into public.tasks (
    id,
    workspace_id,
    project_id,
    parent_task_id,
    type,
    title,
    description,
    priority,
    start_date,
    end_date,
    progress,
    sort_order,
    created_by,
    completed_at
  )
  select
    task.id,
    workspace_id,
    project_id,
    task.parent_task_id,
    task.type::public.task_type,
    task.title,
    coalesce(task.description, ''),
    'normal'::public.task_priority,
    task.start_date,
    task.end_date,
    task.progress,
    task.sort_order,
    (select auth.uid()),
    task.completed_at
  from jsonb_to_recordset(coalesce(p_payload -> 'tasks', '[]'::jsonb))
    as task(
      id uuid,
      parent_task_id uuid,
      type text,
      title text,
      description text,
      start_date date,
      end_date date,
      progress integer,
      sort_order integer,
      completed_at timestamptz
    );

  insert into public.task_assignees (
    id,
    workspace_id,
    project_id,
    task_id,
    user_id
  )
  select
    assignee.id,
    workspace_id,
    project_id,
    assignee.task_id,
    assignee.user_id
  from jsonb_to_recordset(coalesce(p_payload -> 'task_assignees', '[]'::jsonb))
    as assignee(id uuid, task_id uuid, user_id uuid);

  insert into public.task_dependencies (
    id,
    workspace_id,
    project_id,
    predecessor_task_id,
    successor_task_id,
    type,
    lag_working_days
  )
  select
    dependency.id,
    workspace_id,
    project_id,
    dependency.predecessor_task_id,
    dependency.successor_task_id,
    'FS'::public.dependency_type,
    0
  from jsonb_to_recordset(coalesce(p_payload -> 'dependencies', '[]'::jsonb))
    as dependency(id uuid, predecessor_task_id uuid, successor_task_id uuid);

  if baseline_data is not null and baseline_data <> 'null'::jsonb then
    insert into public.budget_lines (
      id,
      workspace_id,
      project_id,
      task_id,
      cost_code,
      category,
      description,
      planned_minor,
      currency,
      created_by
    )
    values (
      (baseline_data ->> 'id')::uuid,
      workspace_id,
      project_id,
      null,
      'BASELINE',
      baseline_data ->> 'category',
      baseline_data ->> 'description',
      (baseline_data ->> 'planned_minor')::bigint,
      project_data ->> 'currency',
      (select auth.uid())
    );
  end if;

  return project_id;
end;
$$;

revoke all on function public.create_project_bundle(jsonb) from public, anon;
grant execute on function public.create_project_bundle(jsonb) to authenticated;

create or replace function public.write_audit_event(
  p_workspace_id uuid,
  p_project_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_summary text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_event_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if not (select private.is_workspace_member(p_workspace_id)) then
    raise exception 'Workspace access denied' using errcode = '42501';
  end if;

  if p_project_id is not null
     and not (select private.can_access_project(p_project_id)) then
    raise exception 'Project access denied' using errcode = '42501';
  end if;

  insert into public.audit_events (
    workspace_id,
    project_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    summary,
    metadata
  )
  values (
    p_workspace_id,
    p_project_id,
    (select auth.uid()),
    left(p_action, 120),
    left(p_entity_type, 80),
    p_entity_id,
    left(p_summary, 2000),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into created_event_id;

  return created_event_id;
end;
$$;

revoke all on function public.write_audit_event(
  uuid,
  uuid,
  text,
  text,
  uuid,
  text,
  jsonb
) from public, anon;

grant execute on function public.write_audit_event(
  uuid,
  uuid,
  text,
  text,
  uuid,
  text,
  jsonb
) to authenticated;
