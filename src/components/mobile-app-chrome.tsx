"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  FolderKanban,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
  X,
} from "lucide-react";

import { signOutAction } from "@/app/auth/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ThemeControl } from "@/components/theme-control";

export function MobileAppChrome({
  userName,
  userEmail,
  workspaceName,
}: {
  userName: string;
  userEmail: string;
  workspaceName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const isHome = pathname === "/app";
  const items = [
    { href: "/app", label: "Home", icon: Home, active: isHome },
    {
      href: "/app/projects",
      label: "Projects",
      icon: FolderKanban,
      active: pathname.startsWith("/app/projects"),
    },
    {
      href: "/app/activity",
      label: "Activity",
      icon: Activity,
      active: pathname === "/app/activity",
    },
    {
      href: "/app/settings/local",
      label: "Settings",
      icon: Settings,
      active: pathname === "/app/settings/local",
    },
  ];

  useEffect(() => {
    if (!accountOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [accountOpen]);

  const initials =
    userName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "PU";

  return (
    <>
      <header className="mobile-app-topbar">
        {isHome ? (
          <span className="mobile-brand-mark" aria-hidden="true">P</span>
        ) : (
          <button aria-label="Go back" onClick={() => router.back()} type="button">
            <ArrowLeft aria-hidden="true" size={20} />
          </button>
        )}
        <span className="mobile-app-identity">
          <strong>{isHome ? workspaceName : "Planisher"}</strong>
          <small>{isHome ? `Hello, ${userName.split(/\s+/)[0]}` : workspaceName}</small>
        </span>
        <button
          aria-expanded={accountOpen}
          aria-haspopup="menu"
          aria-label="Open account menu"
          className="mobile-user-avatar"
          onClick={() => setAccountOpen((open) => !open)}
          type="button"
        >
          {accountOpen ? <X aria-hidden="true" size={17} /> : initials}
        </button>
      </header>
      {accountOpen ? (
        <>
          <button
            aria-label="Close account menu"
            className="mobile-account-scrim"
            onClick={() => setAccountOpen(false)}
            type="button"
          />
          <div className="mobile-account-menu" ref={accountMenuRef} role="menu">
            <div className="mobile-account-identity">
              <span>{initials}</span>
              <div>
                <strong>{userName}</strong>
                <small>{userEmail}</small>
              </div>
            </div>
            <Link href="/app" onClick={() => setAccountOpen(false)} role="menuitem">
              <LayoutDashboard aria-hidden="true" size={17} />
              Dashboard
            </Link>
            <Link
              href="/app/settings/local"
              onClick={() => setAccountOpen(false)}
              role="menuitem"
            >
              <UserRound aria-hidden="true" size={17} />
              Account and device
            </Link>
            <ThemeControl followDevice />
            <form action={signOutAction}>
              <FormSubmitButton
                className="mobile-account-signout"
                icon={<LogOut aria-hidden="true" size={17} />}
                label="Sign out"
                pendingLabel="Signing out…"
              />
            </form>
          </div>
        </>
      ) : null}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link className={item.active ? "active" : ""} href={item.href} key={item.href}>
              <Icon aria-hidden="true" size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
