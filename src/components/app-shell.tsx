"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  CalendarRange,
  ChevronDown,
  CircleHelp,
  FolderKanban,
  LayoutDashboard,
  Library,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";

import { LocaleSummary } from "@/components/locale-summary";
import { NewProjectButton } from "@/components/action-buttons";
import { useLocalStore } from "@/components/local-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { projects } = useLocalStore();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const primaryProjectId = projects[0]?.id ?? "riverside-villa";
  const navigation = [
    {
      href: "/app",
      label: "Overview",
      icon: LayoutDashboard,
      active: pathname === "/app",
    },
    {
      href: "/app/projects",
      label: "Projects",
      icon: FolderKanban,
      active:
        pathname === "/app/projects" ||
        (pathname.startsWith("/app/projects/") &&
          !pathname.endsWith("/schedule")),
    },
    {
      href: `/app/projects/${primaryProjectId}/schedule`,
      label: "Schedule",
      icon: CalendarRange,
      active: pathname.endsWith("/schedule"),
    },
    {
      href: "/app/budget",
      label: "Budget",
      icon: BarChart3,
      active: pathname === "/app/budget",
    },
    {
      href: "/app/templates",
      label: "Templates",
      icon: Library,
      active: pathname === "/app/templates",
    },
  ];

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="brand" href="/app">
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          <span>Planisher</span>
        </Link>

        <div className="workspace-switcher">
          <button
            aria-expanded={switcherOpen}
            aria-haspopup="menu"
            className="workspace-card"
            onClick={() => setSwitcherOpen((open) => !open)}
            type="button"
          >
            <span className="workspace-monogram">CH</span>
            <span>
              <strong>CraftHaus</strong>
              <small>Local workspace</small>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={switcherOpen ? "chevron-open" : ""}
              size={16}
            />
          </button>
          {switcherOpen ? (
            <div className="workspace-menu" role="menu">
              <span className="workspace-menu-label">Open a project</span>
              {projects.slice(0, 6).map((project) => (
                <Link
                  href={`/app/projects/${project.id}/overview`}
                  key={project.id}
                  onClick={() => setSwitcherOpen(false)}
                  role="menuitem"
                >
                  <span>{project.code}</span>
                  {project.name}
                </Link>
              ))}
              <Link
                href="/app/projects"
                onClick={() => setSwitcherOpen(false)}
                role="menuitem"
              >
                View all projects
              </Link>
            </div>
          ) : null}
        </div>

        <NewProjectButton className="create-project-button" />

        <nav className="primary-nav" aria-label="Primary navigation">
          <span className="nav-eyebrow">Workspace</span>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className={item.active ? "nav-link active" : "nav-link"}
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
