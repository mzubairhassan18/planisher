"use client";

import { useSyncExternalStore } from "react";
import { Globe2, HardDrive, RotateCcw } from "lucide-react";

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
        <span className="eyebrow">Development</span>
        <h1>Local settings</h1>
        <p>Transparent defaults for this browser and local workspace.</p>
      </header>
      <div className="settings-grid">
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
          <HardDrive aria-hidden="true" size={22} />
          <div>
            <h2>Storage</h2>
            <p>Mock data currently lives in the application bundle.</p>
            <span className="local-pill">Local only</span>
          </div>
        </article>
        <article className="content-card settings-card">
          <RotateCcw aria-hidden="true" size={22} />
          <div>
            <h2>Reset behavior</h2>
            <p>Server restarts restore the seeded CraftHaus workspace.</p>
          </div>
        </article>
      </div>
    </div>
  );
}
