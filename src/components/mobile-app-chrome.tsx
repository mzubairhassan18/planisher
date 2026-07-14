"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  FolderKanban,
  Home,
  Settings,
} from "lucide-react";

export function MobileAppChrome({
  userName,
  workspaceName,
}: {
  userName: string;
  workspaceName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
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
        <Link aria-label="Open settings" className="mobile-user-avatar" href="/app/settings/local">
          {userName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "PU"}
        </Link>
      </header>
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
