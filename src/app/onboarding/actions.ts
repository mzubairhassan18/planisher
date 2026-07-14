"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";

const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  jobRole: z.string().trim().min(2).max(80),
  locale: z.string().trim().min(2).max(35),
  workspaceName: z.string().trim().min(2).max(100),
  workspaceType: z.enum(["personal", "builder", "contractor", "company"]),
  estimatedTeamSize: z.coerce.number().int().min(1).max(1000),
  timezone: z.string().trim().min(1).max(100),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
});

export interface OnboardingActionState {
  error?: string;
}

export async function completeOnboardingAction(
  _previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    jobRole: formData.get("jobRole"),
    locale: formData.get("locale"),
    workspaceName: formData.get("workspaceName"),
    workspaceType: formData.get("workspaceType"),
    estimatedTeamSize: formData.get("estimatedTeamSize"),
    timezone: formData.get("timezone"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    return { error: "Review the setup details and complete every required field." };
  }

  const supabase = createClient(await cookies());
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return { error: "Your session expired. Sign in again to complete setup." };
  }

  const values = parsed.data;
  const { error } = await supabase.rpc("complete_onboarding", {
    p_name: values.name,
    p_job_role: values.jobRole,
    p_locale: values.locale,
    p_workspace_name: values.workspaceName,
    p_workspace_type: values.workspaceType,
    p_estimated_team_size: values.estimatedTeamSize,
    p_timezone: values.timezone,
    p_currency: values.currency,
  });

  if (error) {
    return {
      error:
        "Planisher could not save the workspace setup. Please try again.",
    };
  }

  revalidatePath("/app", "layout");
  redirect("/app");
}
