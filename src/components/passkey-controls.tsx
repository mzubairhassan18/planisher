"use client";

import { useState, useSyncExternalStore } from "react";
import { Fingerprint, KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

function useInstalledMobileApp() {
  return useSyncExternalStore(
    (listener) => {
      const displayMode = window.matchMedia("(display-mode: standalone)");
      const mobile = window.matchMedia("(max-width: 760px)");
      displayMode.addEventListener("change", listener);
      mobile.addEventListener("change", listener);
      window.addEventListener("appinstalled", listener);
      return () => {
        displayMode.removeEventListener("change", listener);
        mobile.removeEventListener("change", listener);
        window.removeEventListener("appinstalled", listener);
      };
    },
    () => {
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      return installed && window.matchMedia("(max-width: 760px)").matches;
    },
    () => false,
  );
}

function friendlyPasskeyError(message: string) {
  if (message.includes("passkey_disabled")) {
    return "Passkeys are not enabled for this Planisher environment yet.";
  }
  if (message.toLowerCase().includes("cancel")) return "Passkey setup was cancelled.";
  return message;
}

export function PasskeySignInButton() {
  const router = useRouter();
  const isInstalledMobile = useInstalledMobileApp();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (!isInstalledMobile || !("credentials" in navigator)) return null;

  return (
    <div className="passkey-signin-block">
      <span>or</span>
      <button
        className="secondary-button passkey-button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          const supabase = createClient();
          const { error: passkeyError } = await supabase.auth.signInWithPasskey();
          setPending(false);
          if (passkeyError) {
            setError(friendlyPasskeyError(passkeyError.message));
            return;
          }
          router.replace("/app");
          router.refresh();
        }}
        type="button"
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="spin" size={18} />
        ) : (
          <Fingerprint aria-hidden="true" size={19} />
        )}
        {pending ? "Checking passkey…" : "Use Face ID or fingerprint"}
      </button>
      {error ? <p className="passkey-error">{error}</p> : null}
    </div>
  );
}

export function PasskeySettingsCard() {
  const isInstalledMobile = useInstalledMobileApp();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!isInstalledMobile || !("credentials" in navigator)) return null;

  return (
    <article className="content-card settings-card passkey-settings-card">
      <ShieldCheck aria-hidden="true" size={22} />
      <div>
        <h2>Phone passkey</h2>
        <p>
          Register this account for quick sign-in using the screen lock on this
          phone. Planisher never receives your fingerprint or face data.
        </p>
        <button
          className="primary-button compact"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setMessage("");
            setError("");
            const supabase = createClient();
            const { error: passkeyError } = await supabase.auth.registerPasskey();
            setPending(false);
            if (passkeyError) {
              setError(friendlyPasskeyError(passkeyError.message));
              return;
            }
            setMessage("Passkey registered. You can use it on the next sign-in.");
          }}
          type="button"
        >
          {pending ? (
            <LoaderCircle aria-hidden="true" className="spin" size={16} />
          ) : (
            <KeyRound aria-hidden="true" size={16} />
          )}
          {pending ? "Registering…" : "Register this phone"}
        </button>
        {message ? <p className="passkey-success">{message}</p> : null}
        {error ? <p className="passkey-error">{error}</p> : null}
      </div>
    </article>
  );
}
