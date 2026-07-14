"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  Building2,
  Check,
  LoaderCircle,
  UsersRound,
  UserRound,
} from "lucide-react";

import {
  completeOnboardingAction,
  type OnboardingActionState,
} from "@/app/onboarding/actions";
import {
  detectLocaleSettings,
  fallbackLocaleSettings,
} from "@/lib/locale";
import {
  finishNavigationProgress,
  startNavigationProgress,
} from "@/components/navigation-progress";

const initialState: OnboardingActionState = {};

export function OnboardingDialog({
  email,
  initialName,
}: {
  email: string;
  initialName: string;
}) {
  const [state, formAction, pending] = useActionState(
    completeOnboardingAction,
    initialState,
  );
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialName);
  const [jobRole, setJobRole] = useState("owner_builder");
  const [workspaceName, setWorkspaceName] = useState(
    `${initialName.split(/\s+/)[0] || "My"}'s workspace`,
  );
  const [workspaceType, setWorkspaceType] = useState("personal");
  const [estimatedTeamSize, setEstimatedTeamSize] = useState("1");
  const [locale, setLocale] = useState(fallbackLocaleSettings.locale);
  const [timezone, setTimezone] = useState(fallbackLocaleSettings.timezone);
  const [currency, setCurrency] = useState(fallbackLocaleSettings.currency);
  const localeDetected = useRef(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      startNavigationProgress();
      return;
    }
    if (wasPending.current) {
      wasPending.current = false;
      const timer = window.setTimeout(finishNavigationProgress, 0);
      return () => window.clearTimeout(timer);
    }
  }, [pending]);

  useEffect(
    () => () => {
      if (wasPending.current) finishNavigationProgress();
    },
    [],
  );

  const canContinueProfile = name.trim().length >= 2 && Boolean(jobRole);
  const canContinueWorkspace =
    workspaceName.trim().length >= 2 &&
    timezone.trim().length > 0 &&
    /^[A-Za-z]{3}$/.test(currency.trim());

  function continueFromProfile() {
    if (!localeDetected.current) {
      const detected = detectLocaleSettings();
      setLocale(detected.locale);
      setTimezone(detected.timezone);
      setCurrency(detected.currency);
      localeDetected.current = true;
    }
    setStep(2);
  }

  return (
    <div className="onboarding-backdrop">
      <section
        aria-labelledby="onboarding-title"
        aria-modal="true"
        className="onboarding-card"
        role="dialog"
      >
        <header className="onboarding-header">
          <span className="brand-mark" aria-hidden="true">P</span>
          <div>
            <span className="eyebrow">Account setup</span>
            <h1 id="onboarding-title">Set up Planisher</h1>
            <p>Complete these details before entering your workspace.</p>
          </div>
        </header>

        <ol className="onboarding-steps" aria-label="Setup progress">
          {["Your profile", "Workspace", "Team"].map((label, index) => {
            const number = index + 1;
            return (
              <li
                className={number === step ? "active" : number < step ? "done" : ""}
                key={label}
              >
                <span>{number < step ? <Check size={13} /> : number}</span>
                {label}
              </li>
            );
          })}
        </ol>

        <form action={formAction} className="onboarding-form">
          <input name="name" type="hidden" value={name} />
          <input name="jobRole" type="hidden" value={jobRole} />
          <input name="locale" type="hidden" value={locale} />
          <input name="workspaceName" type="hidden" value={workspaceName} />
          <input name="workspaceType" type="hidden" value={workspaceType} />
          <input
            name="estimatedTeamSize"
            type="hidden"
            value={estimatedTeamSize}
          />
          <input name="timezone" type="hidden" value={timezone} />
          <input name="currency" type="hidden" value={currency.toUpperCase()} />

          {step === 1 ? (
            <div className="onboarding-panel">
              <div className="onboarding-panel-title">
                <UserRound aria-hidden="true" size={20} />
                <div>
                  <h2>Tell us about you</h2>
                  <p>We use this name on assignments, comments, and audit records.</p>
                </div>
              </div>
              <label className="form-field">
                <span>Full name</span>
                <input
                  autoFocus
                  onChange={(event) => setName(event.target.value)}
                  required
                  value={name}
                />
              </label>
              <label className="form-field">
                <span>Your main role</span>
                <select
                  onChange={(event) => setJobRole(event.target.value)}
                  value={jobRole}
                >
                  <option value="owner_builder">Owner-builder / homeowner</option>
                  <option value="company_owner">Company owner</option>
                  <option value="project_manager">Project manager</option>
                  <option value="site_supervisor">Site supervisor</option>
                  <option value="finance_manager">Finance manager</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <p className="onboarding-account-note">Signed in as {email}</p>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="onboarding-panel">
              <div className="onboarding-panel-title">
                <Building2 aria-hidden="true" size={20} />
                <div>
                  <h2>Create your workspace</h2>
                  <p>Projects, people, files, and billing belong to this workspace.</p>
                </div>
              </div>
              <label className="form-field">
                <span>Workspace or company name</span>
                <input
                  autoFocus
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  required
                  value={workspaceName}
                />
              </label>
              <label className="form-field">
                <span>How will you use Planisher?</span>
                <select
                  onChange={(event) => setWorkspaceType(event.target.value)}
                  value={workspaceType}
                >
                  <option value="personal">Build my own property</option>
                  <option value="builder">Residential builder</option>
                  <option value="contractor">General or specialty contractor</option>
                  <option value="company">Construction company</option>
                </select>
              </label>
              <div className="form-grid two-columns">
                <label className="form-field">
                  <span>Timezone</span>
                  <input
                    onChange={(event) => setTimezone(event.target.value)}
                    required
                    value={timezone}
                  />
                </label>
                <label className="form-field">
                  <span>Currency</span>
                  <input
                    maxLength={3}
                    onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                    required
                    value={currency}
                  />
                </label>
              </div>
              <p className="onboarding-account-note">
                Timezone and currency were detected from this browser. You can correct them now.
              </p>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="onboarding-panel">
              <div className="onboarding-panel-title">
                <UsersRound aria-hidden="true" size={20} />
                <div>
                  <h2>Plan for your team</h2>
                  <p>This helps Planisher prepare the right workspace experience.</p>
                </div>
              </div>
              <label className="form-field">
                <span>Expected collaborators</span>
                <select
                  onChange={(event) => setEstimatedTeamSize(event.target.value)}
                  value={estimatedTeamSize}
                >
                  <option value="1">Just me</option>
                  <option value="5">2–5 people</option>
                  <option value="20">6–20 people</option>
                  <option value="50">21–50 people</option>
                  <option value="100">More than 50 people</option>
                </select>
              </label>
              <div className="onboarding-info">
                <UsersRound aria-hidden="true" size={18} />
                <span>
                  <strong>No dummy team members will be created.</strong>
                  You will invite real members after entering the workspace. Email delivery is not enabled yet, so setup will not pretend invitations were sent.
                </span>
              </div>
            </div>
          ) : null}

          {state.error ? <p className="auth-alert error">{state.error}</p> : null}

          <footer className="onboarding-actions">
            {step > 1 ? (
              <button
                className="secondary-button"
                disabled={pending}
                onClick={() => setStep((current) => current - 1)}
                type="button"
              >
                Back
              </button>
            ) : <span />}
            {step < 3 ? (
              <button
                className="primary-button"
                disabled={
                  step === 1 ? !canContinueProfile : !canContinueWorkspace
                }
                onClick={() => {
                  if (step === 1) continueFromProfile();
                  else setStep(3);
                }}
                type="button"
              >
                Continue
              </button>
            ) : (
              <button
                aria-busy={pending}
                className="primary-button"
                disabled={pending}
                type="submit"
              >
                {pending ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="button-spinner"
                    size={16}
                  />
                ) : null}
                {pending ? "Creating workspace…" : "Finish setup"}
              </button>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}
