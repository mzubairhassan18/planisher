import Link from "next/link";

export function AuthCard({
  alternateHref,
  alternateLabel,
  children,
  description,
  error,
  message,
  title,
}: {
  alternateHref?: string;
  alternateLabel?: string;
  children: React.ReactNode;
  description: string;
  error?: string;
  message?: string;
  title: string;
}) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="auth-brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          Planisher
        </Link>
        <div className="auth-heading">
          <span className="eyebrow">Construction planning, calmly managed</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {error ? <p className="auth-alert error">{error}</p> : null}
        {message ? <p className="auth-alert success">{message}</p> : null}
        {children}
        {alternateHref && alternateLabel ? (
          <Link className="auth-alternate" href={alternateHref}>
            {alternateLabel}
          </Link>
        ) : null}
      </section>
    </main>
  );
}

export function AuthField({
  autoComplete,
  label,
  minLength,
  name,
  placeholder,
  type = "text",
}: {
  autoComplete: string;
  label: string;
  minLength?: number;
  name: string;
  placeholder: string;
  type?: "email" | "password" | "text";
}) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <input
        autoComplete={autoComplete}
        minLength={minLength}
        name={name}
        placeholder={placeholder}
        required
        type={type}
      />
    </label>
  );
}
