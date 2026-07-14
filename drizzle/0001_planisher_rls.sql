-- Planisher Data API grants and tenant-isolation policies.
-- This migration intentionally keeps helper functions in a non-exposed schema.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
  );
$$;

create or replace function private.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
      and wm.role in ('owner', 'admin')
  );
$$;

create or replace function private.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
      and wm.role = 'owner'
  );
$$;

create or replace function private.can_create_project(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
      and wm.role in ('owner', 'admin', 'member')
  );
$$;

create or replace function private.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = target_project_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
      and (
        wm.role in ('owner', 'admin')
        or p.created_by = (select auth.uid())
        or (p.kind = 'template' and wm.role = 'member')
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = p.id
            and pm.user_id = (select auth.uid())
        )
      )
  );
$$;

create or replace function private.can_manage_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = target_project_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
      and (
        wm.role in ('owner', 'admin')
        or p.created_by = (select auth.uid())
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = p.id
            and pm.user_id = (select auth.uid())
            and pm.role = 'project_manager'
        )
      )
  );
$$;

create or replace function private.can_edit_schedule(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = target_project_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
      and (
        wm.role in ('owner', 'admin')
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = p.id
            and pm.user_id = (select auth.uid())
            and pm.role in ('project_manager', 'scheduler')
        )
      )
  );
$$;

create or replace function private.can_edit_task(target_project_id uuid, target_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.can_edit_schedule(target_project_id)) or exists (
    select 1
    from public.project_members pm
    join public.task_assignees ta on ta.project_id = pm.project_id
    where pm.project_id = target_project_id
      and pm.user_id = (select auth.uid())
      and pm.role = 'contributor'
      and ta.task_id = target_task_id
      and ta.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_view_costs(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = target_project_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
      and (
        wm.role in ('owner', 'admin')
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = p.id
            and pm.user_id = (select auth.uid())
            and (pm.can_view_costs or pm.role in ('project_manager', 'finance'))
        )
      )
  );
$$;

create or replace function private.can_edit_costs(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = target_project_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
      and (
        wm.role in ('owner', 'admin')
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = p.id
            and pm.user_id = (select auth.uid())
            and pm.role in ('project_manager', 'finance')
        )
      )
  );
$$;

create or replace function private.shares_workspace_with(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs
      on theirs.workspace_id = mine.workspace_id
    where mine.user_id = (select auth.uid())
      and mine.status = 'active'
      and theirs.user_id = target_user_id
      and theirs.status = 'active'
  );
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

revoke all on table
  public.profiles,
  public.workspaces,
  public.workspace_members,
  public.workspace_invitations,
  public.projects,
  public.project_members,
  public.tasks,
  public.task_assignees,
  public.task_dependencies,
  public.comments,
  public.attachments,
  public.budget_lines,
  public.cost_entries,
  public.audit_events,
  public.workspace_subscriptions
from anon;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table
  public.workspaces,
  public.workspace_members,
  public.workspace_invitations,
  public.projects,
  public.project_members,
  public.tasks,
  public.task_assignees,
  public.task_dependencies,
  public.comments,
  public.attachments,
  public.budget_lines,
  public.cost_entries
to authenticated;
grant select on table public.audit_events to authenticated;
grant select, insert on table public.workspace_subscriptions to authenticated;

create policy profiles_select on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.shares_workspace_with(id)));
create policy profiles_insert on public.profiles for insert to authenticated
with check (id = (select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy workspaces_select on public.workspaces for select to authenticated
using ((select private.is_workspace_member(id)) or created_by = (select auth.uid()));
create policy workspaces_insert on public.workspaces for insert to authenticated
with check (created_by = (select auth.uid()));
create policy workspaces_update on public.workspaces for update to authenticated
using ((select private.is_workspace_admin(id)))
with check ((select private.is_workspace_admin(id)));
create policy workspaces_delete on public.workspaces for delete to authenticated
using ((select private.is_workspace_owner(id)));

create policy workspace_members_select on public.workspace_members for select to authenticated
using ((select private.is_workspace_member(workspace_id)) or user_id = (select auth.uid()));
create policy workspace_members_insert on public.workspace_members for insert to authenticated
with check (
  (select private.is_workspace_admin(workspace_id))
  or (
    user_id = (select auth.uid())
    and role = 'owner'
    and exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.created_by = (select auth.uid())
    )
  )
);
create policy workspace_members_update on public.workspace_members for update to authenticated
using ((select private.is_workspace_admin(workspace_id)))
with check ((select private.is_workspace_admin(workspace_id)));
create policy workspace_members_delete on public.workspace_members for delete to authenticated
using ((select private.is_workspace_admin(workspace_id)));

create policy workspace_invitations_select on public.workspace_invitations for select to authenticated
using ((select private.is_workspace_admin(workspace_id)));
create policy workspace_invitations_insert on public.workspace_invitations for insert to authenticated
with check ((select private.is_workspace_admin(workspace_id)) and invited_by = (select auth.uid()));
create policy workspace_invitations_update on public.workspace_invitations for update to authenticated
using ((select private.is_workspace_admin(workspace_id)))
with check ((select private.is_workspace_admin(workspace_id)));
create policy workspace_invitations_delete on public.workspace_invitations for delete to authenticated
using ((select private.is_workspace_admin(workspace_id)));

create policy projects_select on public.projects for select to authenticated
using ((select private.can_access_project(id)));
create policy projects_insert on public.projects for insert to authenticated
with check ((select private.can_create_project(workspace_id)) and created_by = (select auth.uid()));
create policy projects_update on public.projects for update to authenticated
using ((select private.can_manage_project(id)))
with check ((select private.can_manage_project(id)));
create policy projects_delete on public.projects for delete to authenticated
using ((select private.can_manage_project(id)));

create policy project_members_select on public.project_members for select to authenticated
using ((select private.can_access_project(project_id)));
create policy project_members_insert on public.project_members for insert to authenticated
with check ((select private.can_manage_project(project_id)));
create policy project_members_update on public.project_members for update to authenticated
using ((select private.can_manage_project(project_id)))
with check ((select private.can_manage_project(project_id)));
create policy project_members_delete on public.project_members for delete to authenticated
using ((select private.can_manage_project(project_id)));

create policy tasks_select on public.tasks for select to authenticated
using ((select private.can_access_project(project_id)));
create policy tasks_insert on public.tasks for insert to authenticated
with check ((select private.can_edit_schedule(project_id)) and created_by = (select auth.uid()));
create policy tasks_update on public.tasks for update to authenticated
using ((select private.can_edit_task(project_id, id)))
with check ((select private.can_edit_task(project_id, id)));
create policy tasks_delete on public.tasks for delete to authenticated
using ((select private.can_edit_schedule(project_id)));

create policy task_assignees_select on public.task_assignees for select to authenticated
using ((select private.can_access_project(project_id)));
create policy task_assignees_insert on public.task_assignees for insert to authenticated
with check ((select private.can_edit_schedule(project_id)));
create policy task_assignees_update on public.task_assignees for update to authenticated
using ((select private.can_edit_schedule(project_id)))
with check ((select private.can_edit_schedule(project_id)));
create policy task_assignees_delete on public.task_assignees for delete to authenticated
using ((select private.can_edit_schedule(project_id)));

create policy task_dependencies_select on public.task_dependencies for select to authenticated
using ((select private.can_access_project(project_id)));
create policy task_dependencies_insert on public.task_dependencies for insert to authenticated
with check ((select private.can_edit_schedule(project_id)));
create policy task_dependencies_update on public.task_dependencies for update to authenticated
using ((select private.can_edit_schedule(project_id)))
with check ((select private.can_edit_schedule(project_id)));
create policy task_dependencies_delete on public.task_dependencies for delete to authenticated
using ((select private.can_edit_schedule(project_id)));

create policy comments_select on public.comments for select to authenticated
using ((select private.can_access_project(project_id)));
create policy comments_insert on public.comments for insert to authenticated
with check ((select private.can_access_project(project_id)) and author_id = (select auth.uid()));
create policy comments_update on public.comments for update to authenticated
using (author_id = (select auth.uid()) or (select private.can_manage_project(project_id)))
with check (author_id = (select auth.uid()) or (select private.can_manage_project(project_id)));
create policy comments_delete on public.comments for delete to authenticated
using (author_id = (select auth.uid()) or (select private.can_manage_project(project_id)));

create policy attachments_select on public.attachments for select to authenticated
using ((select private.can_access_project(project_id)));
create policy attachments_insert on public.attachments for insert to authenticated
with check ((select private.can_access_project(project_id)) and uploaded_by = (select auth.uid()));
create policy attachments_update on public.attachments for update to authenticated
using (uploaded_by = (select auth.uid()) or (select private.can_manage_project(project_id)))
with check (uploaded_by = (select auth.uid()) or (select private.can_manage_project(project_id)));
create policy attachments_delete on public.attachments for delete to authenticated
using (uploaded_by = (select auth.uid()) or (select private.can_manage_project(project_id)));

create policy budget_lines_select on public.budget_lines for select to authenticated
using ((select private.can_view_costs(project_id)));
create policy budget_lines_insert on public.budget_lines for insert to authenticated
with check ((select private.can_edit_costs(project_id)) and created_by = (select auth.uid()));
create policy budget_lines_update on public.budget_lines for update to authenticated
using ((select private.can_edit_costs(project_id)))
with check ((select private.can_edit_costs(project_id)));
create policy budget_lines_delete on public.budget_lines for delete to authenticated
using ((select private.can_edit_costs(project_id)));

create policy cost_entries_select on public.cost_entries for select to authenticated
using ((select private.can_view_costs(project_id)));
create policy cost_entries_insert on public.cost_entries for insert to authenticated
with check ((select private.can_edit_costs(project_id)) and created_by = (select auth.uid()));
create policy cost_entries_update on public.cost_entries for update to authenticated
using ((select private.can_edit_costs(project_id)))
with check ((select private.can_edit_costs(project_id)));
create policy cost_entries_delete on public.cost_entries for delete to authenticated
using ((select private.can_edit_costs(project_id)));

create policy audit_events_select on public.audit_events for select to authenticated
using (
  (select private.is_workspace_member(workspace_id))
  and (project_id is null or (select private.can_access_project(project_id)))
);

create policy workspace_subscriptions_select on public.workspace_subscriptions for select to authenticated
using ((select private.is_workspace_member(workspace_id)));
create policy workspace_subscriptions_insert on public.workspace_subscriptions for insert to authenticated
with check (
  plan = 'personal'
  and status = 'active'
  and provider_customer_id is null
  and provider_subscription_id is null
  and exists (
    select 1 from public.workspaces w
    where w.id = workspace_id and w.created_by = (select auth.uid())
  )
);
