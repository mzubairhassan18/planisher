"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemePreference = "light" | "dark" | "system";

const themeStorageKey = "planisher-theme";

function resolveTheme(preference: ThemePreference) {
  if (preference !== "system") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(preference: ThemePreference) {
  document.documentElement.dataset.theme = resolveTheme(preference);
  document.documentElement.dataset.themePreference = preference;
}

export function ThemeControl() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = window.localStorage.getItem(themeStorageKey);
    const initial: ThemePreference =
      stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "system";
    applyTheme(initial);
    const frame = window.requestAnimationFrame(() => setPreference(initial));

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if ((window.localStorage.getItem(themeStorageKey) ?? "system") === "system") {
        applyTheme("system");
      }
    };
    media.addEventListener("change", onSystemChange);
    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener("change", onSystemChange);
    };
  }, []);

  function choose(next: ThemePreference) {
    window.localStorage.setItem(themeStorageKey, next);
    setPreference(next);
    applyTheme(next);
  }

  const options = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <div className="theme-control" role="group" aria-label="Color theme">
      <span className="theme-control-label">Appearance</span>
      <div>
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              aria-pressed={preference === option.value}
              key={option.value}
              onClick={() => choose(option.value)}
              title={`${option.label} theme`}
              type="button"
            >
              <Icon aria-hidden="true" size={14} />
              <span className="sr-only">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
