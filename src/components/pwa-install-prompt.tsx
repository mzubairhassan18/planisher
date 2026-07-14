"use client";

import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || window.innerWidth > 760) return;
    const dismissedAt = Number(
      window.localStorage.getItem("planisher-install-dismissed-at") || 0,
    );
    if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;

    if (isIosDevice()) {
      const timer = window.setTimeout(() => {
        setShowIosHelp(true);
        setVisible(true);
      }, 1800);
      return () => window.clearTimeout(timer);
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => setVisible(false);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible) return null;

  function dismiss() {
    window.localStorage.setItem(
      "planisher-install-dismissed-at",
      String(Date.now()),
    );
    setVisible(false);
  }

  return (
    <aside className="pwa-install-card" aria-label="Install Planisher">
      <button
        aria-label="Dismiss install suggestion"
        className="pwa-install-dismiss"
        onClick={dismiss}
        type="button"
      >
        <X aria-hidden="true" size={16} />
      </button>
      <span className="pwa-install-icon" aria-hidden="true">
        P
      </span>
      <div>
        <strong>Keep Planisher on this phone</strong>
        <p>
          {showIosHelp
            ? "Open Share, then choose Add to Home Screen."
            : "Install the field view for faster, app-like access."}
        </p>
      </div>
      {showIosHelp ? (
        <span className="pwa-ios-hint">
          <Share2 aria-hidden="true" size={15} /> Share
        </span>
      ) : (
        <button
          className="primary-button compact"
          onClick={async () => {
            if (!installEvent) return;
            await installEvent.prompt();
            const choice = await installEvent.userChoice;
            if (choice.outcome === "accepted") setVisible(false);
            setInstallEvent(null);
          }}
          type="button"
        >
          <Download aria-hidden="true" size={15} />
          Install
        </button>
      )}
    </aside>
  );
}
