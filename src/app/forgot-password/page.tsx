import { forgotPasswordAction } from "@/app/auth/actions";
import { AuthCard, AuthField } from "@/components/auth-card";
import { FormSubmitButton } from "@/components/form-submit-button";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthCard
      alternateHref="/sign-in"
      alternateLabel="Return to sign in"
      description="We will send a secure password-reset link to your email."
      error={error}
      title="Reset your password"
    >
      <form action={forgotPasswordAction} className="auth-form">
        <AuthField
          autoComplete="email"
          label="Email address"
          name="email"
          placeholder="you@company.com"
          type="email"
        />
        <FormSubmitButton
          className="primary-button auth-submit"
          label="Send reset link"
          pendingLabel="Sending link…"
        />
      </form>
    </AuthCard>
  );
}
