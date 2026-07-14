import { updatePasswordAction } from "@/app/auth/actions";
import { AuthCard, AuthField } from "@/components/auth-card";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthCard
      description="Choose a new password for your Planisher account."
      error={error}
      title="Set a new password"
    >
      <form action={updatePasswordAction} className="auth-form">
        <AuthField
          autoComplete="new-password"
          label="New password"
          minLength={8}
          name="password"
          placeholder="At least 8 characters"
          type="password"
        />
        <button className="primary-button auth-submit" type="submit">
          Update password
        </button>
      </form>
    </AuthCard>
  );
}
