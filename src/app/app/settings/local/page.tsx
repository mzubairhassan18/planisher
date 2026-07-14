"use client";

import { useSyncExternalStore } from "react";
import { Cloud, Globe2, HardDrive } from "lucide-react";

import { PasskeySettingsCard } from "@/components/passkey-controls";

import {
  getLocaleSettingsSnapshot,
  getServerLocaleSettingsSnapshot,
  subscribeToLocaleSettings,
} from "@/lib/locale";

export default function LocalSettingsPage() {
  const settings = useSyncExternalStore(
    subscribeToLocaleSettings,
    getLocaleSettingsSnapshot,
    getServerLocaleSettingsSnapshot,
  );

  return (
    <div>
      <header className="page-heading">
        <span className="eyebrow">Account and device</span>
        <h1>Settings</h1>
        <p>Security, locale, and a clear view of what is currently saved.</p>
      </header>
      <div className="settings-grid">
        <PasskeySettingsCard />
        <article className="content-card settings-card">
          <Globe2 aria-hidden="true" size={22} />
          <div>
            <h2>Detected locale</h2>
            <dl>
              <div><dt>Locale</dt><dd>{settings.locale}</dd></div>
              <div><dt>Timezone</dt><dd>{settings.timezone}</dd></div>
              <div><dt>Currency</dt><dd>{settings.currency}</dd></div>
            </dl>
          </div>
        </article>
        <article className="content-card settings-card">
          <Cloud aria-hidden="true" size={22} />
          <div>
            <h2>Saved in Supabase</h2>
            <p>
              Your account, profile, workspace membership, and published starter
              templates are stored in the hosted Supabase backend.
            </p>
            <span className="local-pill hosted">Hosted</span>
          </div>
        </article>
        <article className="content-card settings-card">
          <HardDrive aria-hidden="true" size={22} />
          <div>
            <h2>Temporary in this release</h2>
            <p>
              Projects you create, their tasks, comments, costs, cover images,
              and uploaded media still live in browser memory and clear on refresh.
              Do not use them for irreplaceable project records yet.
            </p>
            <span className="local-pill">Not yet persisted</span>
          </div>
        </article>
      </div>
    </div>
  );
}
