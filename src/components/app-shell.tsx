"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarRange,
  ChevronDown,
  CircleHelp,
  FolderKanban,
  LayoutDashboard,
  Library,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";

import { LocaleSummary } from "@/components/locale-summary";

const navigation = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/projects", label: "Projects", icon: FolderKanban },
  {
    href: "/app/projects/riverside-villa/schedule",
    label: "Schedule",
    icon: CalendarRange,
  },
  { href: "/app/budget", label: "Budget", icon: BarChart3 },
  { href: "/app/templates", label: "Templates", icon: Library },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="brand" href="/app">
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          <span>Planisher</span>
        </Link>

        <button className="workspace-card" type="button">
          <span className="workspace-monogram">CH</span>
          <span>
            <strong>CraftHaus</strong>
            <small>Local workspace</small>
          </span>
          <ChevronDown aria-hidden="true" size={16} />
        </button>

        <Link className="create-project-button" href="/app/projects?create=true">
          <Plus aria-hidden="true" size={17} />
          New project
        </Link>

        <nav className="primary-nav" aria-label="Primary navigation">
          <span className="nav-eyebrow">Workspace</span>
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/app"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                className={active ? "nav-link active" : "nav-link"}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="demo-note">
          <Sparkles aria-hidden="true" size={16} />
          <span>
            <strong>Local demo</strong>
            Data resets on restart
          </span>
        </div>

        <nav className="secondary-nav" aria-label="Secondary navigation">
          <Link className="nav-link" href="/app/settings/local">
            <Settings aria-hidden="true" size={18} />
            Local settings
          </Link>
          <a className="nav-link" href="#help">
            <CircleHelp aria-hidden="true" size={18} />
            Help
          </a>
        </nav>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <label className="global-search">
            <Search aria-hidden="true" size={17} />
            <span className="sr-only">Search Planisher</span>
            <input placeholder="Search projects and tasks…" />
            <kbd>⌘ K</kbd>
          </label>
          <LocaleSummary />
          <div className="topbar-avatar" aria-label="Local demo user">
            AK
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
