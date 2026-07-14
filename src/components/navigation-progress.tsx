"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const startEventName = "planisher:navigation-start";
const finishEventName = "planisher:navigation-finish";

export function startNavigationProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(startEventName));
  }
}

export function finishNavigationProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(finishEventName));
  }
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "running" | "finishing">(
    "idle",
  );
  const mounted = useRef(false);
  const hideTimer = useRef<number | undefined>(undefined);

  const start = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    setProgress((current) => (current > 0 && current < 100 ? current : 12));
    setPhase("running");
  }, []);

  const finish = useCallback(() => {
    setProgress(100);
    setPhase("finishing");
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      setPhase("idle");
      setProgress(0);
    }, 260);
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const timer = window.setTimeout(finish, 0);
    return () => window.clearTimeout(timer);
  }, [finish, routeKey]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      ) {
        return;
      }
      start();
    }

    window.addEventListener(startEventName, start);
    window.addEventListener(finishEventName, finish);
    window.addEventListener("pageshow", finish);
    document.addEventListener("click", onDocumentClick);
    return () => {
      window.removeEventListener(startEventName, start);
      window.removeEventListener(finishEventName, finish);
      window.removeEventListener("pageshow", finish);
      document.removeEventListener("click", onDocumentClick);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [finish, start]);

  useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current;
        const remaining = 92 - current;
        return Math.min(92, current + Math.max(0.7, remaining * 0.085));
      });
    }, 280);
    return () => window.clearInterval(timer);
  }, [phase]);

  return (
    <div
      aria-hidden="true"
      className={`navigation-progress ${phase !== "idle" ? "visible" : ""} ${
        phase === "finishing" ? "finishing" : ""
      }`}
    >
      <span style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}
