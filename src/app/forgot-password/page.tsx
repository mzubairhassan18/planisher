import { forgotPasswordAction } from "@/app/auth/actions";
import { AuthCard, AuthField } from "@/components/auth-card";

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
        <button className="primary-button auth-submit" type="submit">
          Send reset link
        </button>
      </form>
    </AuthCard>
  );
}
