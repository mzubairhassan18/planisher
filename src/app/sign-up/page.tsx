import { signUpAction } from "@/app/auth/actions";
import { AuthCard, AuthField } from "@/components/auth-card";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthCard
      alternateHref="/sign-in"
      alternateLabel="Already have an account? Sign in"
      description="Start with one workspace and build a reusable construction plan."
      error={error}
      title="Create your account"
    >
      <form action={signUpAction} className="auth-form">
        <AuthField
          autoComplete="name"
          label="Full name"
          name="name"
          placeholder="Your name"
        />
        <AuthField
          autoComplete="email"
          label="Email address"
          name="email"
          placeholder="you@company.com"
          type="email"
        />
        <AuthField
          autoComplete="new-password"
          label="Password"
          minLength={8}
          name="password"
          placeholder="At least 8 characters"
          type="password"
        />
        <button className="primary-button auth-submit" type="submit">
          Create account
        </button>
      </form>
    </AuthCard>
  );
}
