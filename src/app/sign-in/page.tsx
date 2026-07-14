import Link from "next/link";

import { signInAction } from "@/app/auth/actions";
import { AuthCard, AuthField } from "@/components/auth-card";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PasskeySignInButton } from "@/components/passkey-controls";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <AuthCard
      alternateHref="/sign-up"
      alternateLabel="New to Planisher? Create an account"
      description="Open your projects, schedules, costs, and field updates."
      error={error}
      message={message}
      title="Welcome back"
    >
      <form action={signInAction} className="auth-form">
        <AuthField
          autoComplete="email"
          label="Email address"
          name="email"
          placeholder="you@company.com"
          type="email"
        />
        <AuthField
          autoComplete="current-password"
          label="Password"
          name="password"
          placeholder="Your password"
          type="password"
        />
        <Link className="auth-forgot" href="/forgot-password">
          Forgot password?
        </Link>
        <FormSubmitButton
          className="primary-button auth-submit"
          label="Sign in"
          pendingLabel="Signing in…"
        />
      </form>
      <PasskeySignInButton />
    </AuthCard>
  );
}
