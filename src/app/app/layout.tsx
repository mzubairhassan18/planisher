import { AppShell } from "@/components/app-shell";
import { LocalDialogs } from "@/components/local-dialogs";
import { LocalStoreProvider } from "@/components/local-store";
import { OnboardingDialog } from "@/components/onboarding-dialog";
import {
  mapStarterTemplates,
  type StarterTemplateRow,
} from "@/lib/starter-templates";
import { loadWorkspaceData } from "@/server/load-workspace-data";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient(await cookies());
  const {
    data,
    error,
  } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/sign-in");
  }

  const userId = data.claims.sub;
  const [
    { data: profile },
    { data: membership },
    { data: starterTemplateRows },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, job_role")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("starter_templates")
      .select(
        `
          id,
          name,
          category,
          description,
          estimated_duration_days,
          created_at,
          starter_template_tasks (
            id,
            type,
            title,
            description,
            start_offset_days,
            duration_days,
            sort_order
          ),
          starter_template_dependencies (
            id,
            predecessor_task_id,
            successor_task_id
          )
        `,
      )
      .eq("is_published", true)
      .order("name"),
  ]);
  const { data: workspace } = membership?.workspace_id
    ? await supabase
        .from("workspaces")
        .select("name, default_timezone, default_currency")
        .eq("id", membership.workspace_id)
        .maybeSingle()
    : { data: null };
  const userMetadata = data.claims.user_metadata;
  const email = typeof data.claims.email === "string" ? data.claims.email : "";
  const metadataName =
    typeof userMetadata === "object" &&
    userMetadata !== null &&
    "full_name" in userMetadata &&
    typeof userMetadata.full_name === "string"
      ? userMetadata.full_name
      : undefined;
  const displayName: string =
    profile?.name || metadataName || email.split("@")[0] || "Planisher user";
  const jobRole = profile?.job_role
    ? profile.job_role
        .split("_")
        .map((part: string) => part[0]?.toUpperCase() + part.slice(1))
        .join(" ")
    : "Workspace owner";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join("");
  const currentUser = {
    id: userId,
    name: displayName,
    initials: initials || "PU",
    role: jobRole,
    color: "#1f6b4f",
  };
  const starterTemplates = mapStarterTemplates(
    starterTemplateRows as StarterTemplateRow[] | null,
  );
  const storeData =
    membership?.workspace_id && workspace
      ? await loadWorkspaceData({
          currentUser,
          starterTemplates,
          supabase,
          workspaceId: membership.workspace_id,
        })
      : {
          projects: [],
          templates: starterTemplates,
          comments: [],
          files: [],
          activity: [],
          budgetLines: [],
          costEntries: [],
          members: [currentUser],
        };

  return (
    <LocalStoreProvider
      currency={workspace?.default_currency ?? "USD"}
      currentUser={currentUser}
      initialActivity={storeData.activity}
      initialBudgetLines={storeData.budgetLines}
      initialComments={storeData.comments}
      initialCostEntries={storeData.costEntries}
      initialFiles={storeData.files}
      initialMembers={storeData.members}
      initialProjects={storeData.projects}
      initialTemplates={storeData.templates}
      timezone={workspace?.default_timezone ?? "UTC"}
      workspaceId={membership?.workspace_id ?? "00000000-0000-0000-0000-000000000000"}
    >
      <AppShell
        user={{ email, name: displayName }}
        workspaceName={workspace?.name ?? "Personal workspace"}
      >
        {children}
      </AppShell>
      <LocalDialogs />
      {!profile || !membership ? (
        <OnboardingDialog email={email} initialName={displayName} />
      ) : null}
    </LocalStoreProvider>
  );
}
