"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && navigator.standalone === true);
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const syncInstalledTheme = () => {
      if (!standalone) return;
      document.documentElement.dataset.theme = colorScheme.matches
        ? "dark"
        : "light";
      document.documentElement.dataset.themePreference = "system";
    };
    syncInstalledTheme();
    colorScheme.addEventListener("change", syncInstalledTheme);

    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return () => colorScheme.removeEventListener("change", syncInstalledTheme);
    }
    const register = () => navigator.serviceWorker.register("/sw.js");
    window.addEventListener("load", register);
    return () => {
      colorScheme.removeEventListener("change", syncInstalledTheme);
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
