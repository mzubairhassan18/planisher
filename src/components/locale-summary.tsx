"use client";

import { useSyncExternalStore } from "react";
import { Clock3, Coins } from "lucide-react";

import {
  getLocaleSettingsSnapshot,
  getServerLocaleSettingsSnapshot,
  subscribeToLocaleSettings,
} from "@/lib/locale";

export function LocaleSummary() {
  const settings = useSyncExternalStore(
    subscribeToLocaleSettings,
    getLocaleSettingsSnapshot,
    getServerLocaleSettingsSnapshot,
  );

  return (
    <div className="locale-summary" aria-label="Automatically detected settings">
      <span>
        <Clock3 aria-hidden="true" size={14} />
        {settings.timezone}
      </span>
      <span>
        <Coins aria-hidden="true" size={14} />
        {settings.currency}
      </span>
    </div>
  );
}
