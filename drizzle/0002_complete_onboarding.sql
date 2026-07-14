CREATE TYPE "public"."workspace_type" AS ENUM('personal', 'builder', 'contractor', 'company');
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "job_role" text;
--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "type" "workspace_type" DEFAULT 'personal' NOT NULL;
--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "estimated_team_size" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_estimated_team_size_check" CHECK ("workspaces"."estimated_team_size" between 1 and 1000);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_name text,
  p_job_role text,
  p_locale text,
  p_workspace_name text,
  p_workspace_type public.workspace_type,
  p_estimated_team_size integer,
  p_timezone text,
  p_currency text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_workspace_id uuid;
  v_slug_base text;
  v_slug text;
  v_created boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required.' USING ERRCODE = '42501';
  END IF;

  IF length(trim(p_name)) < 2 OR length(trim(p_name)) > 100 THEN
    RAISE EXCEPTION 'Enter a valid name.' USING ERRCODE = '22023';
  END IF;
  IF length(trim(p_workspace_name)) < 2 OR length(trim(p_workspace_name)) > 100 THEN
    RAISE EXCEPTION 'Enter a valid workspace name.' USING ERRCODE = '22023';
  END IF;
  IF p_estimated_team_size < 1 OR p_estimated_team_size > 1000 THEN
    RAISE EXCEPTION 'Team size must be between 1 and 1000.' USING ERRCODE = '22023';
  END IF;
  IF p_currency !~ '^[A-Z]{3}$' THEN
    RAISE EXCEPTION 'Currency must be a three-letter code.' USING ERRCODE = '22023';
  END IF;
  IF length(trim(p_timezone)) < 1 OR length(trim(p_timezone)) > 100 THEN
    RAISE EXCEPTION 'Enter a valid timezone.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.profiles (id, name, job_role, locale)
  VALUES (
    v_user_id,
    trim(p_name),
    nullif(trim(p_job_role), ''),
    left(coalesce(nullif(trim(p_locale), ''), 'en'), 35)
  )
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      job_role = EXCLUDED.job_role,
      locale = EXCLUDED.locale,
      updated_at = now();

  SELECT wm.workspace_id
  INTO v_workspace_id
  FROM public.workspace_members wm
  WHERE wm.user_id = v_user_id
    AND wm.status = 'active'
  ORDER BY wm.created_at
  LIMIT 1;

  IF v_workspace_id IS NULL THEN
    v_slug_base := trim(both '-' from lower(regexp_replace(trim(p_workspace_name), '[^a-zA-Z0-9]+', '-', 'g')));
    IF v_slug_base = '' THEN
      v_slug_base := 'workspace';
    END IF;
    v_slug := left(v_slug_base, 48) || '-' || left(replace(v_user_id::text, '-', ''), 8);

    INSERT INTO public.workspaces (
      name,
      slug,
      type,
      estimated_team_size,
      default_timezone,
      default_currency,
      created_by
    )
    VALUES (
      trim(p_workspace_name),
      v_slug,
      p_workspace_type,
      p_estimated_team_size,
      trim(p_timezone),
      upper(p_currency),
      v_user_id
    )
    RETURNING id INTO v_workspace_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
    VALUES (v_workspace_id, v_user_id, 'owner', 'active');

    v_created := true;
  END IF;

  INSERT INTO public.workspace_subscriptions (workspace_id, plan, status)
  VALUES (v_workspace_id, 'personal', 'active')
  ON CONFLICT (workspace_id) DO NOTHING;

  IF v_created THEN
    INSERT INTO public.audit_events (
      workspace_id,
      actor_user_id,
      action,
      entity_type,
      entity_id,
      summary
    )
    VALUES (
      v_workspace_id,
      v_user_id,
      'workspace.created',
      'workspace',
      v_workspace_id,
      'Completed onboarding and created the workspace.'
    );
  END IF;

  RETURN v_workspace_id;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.complete_onboarding(text, text, text, text, public.workspace_type, integer, text, text) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.complete_onboarding(text, text, text, text, public.workspace_type, integer, text, text) TO authenticated;
