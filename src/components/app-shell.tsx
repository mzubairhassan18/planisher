"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
  UserRound,
} from "lucide-react";

import { NewProjectButton } from "@/components/action-buttons";
import { LocaleSummary } from "@/components/locale-summary";
import { useLocalStore } from "@/components/local-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { projects } = useLocalStore();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const primaryProjectId = projects[0]?.id ?? "riverside-villa";
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const projectResults = projects
      .filter((project) =>
        [project.name, project.code, project.location].some((value) =>
          value.toLowerCase().includes(query),
        ),
      )
      .map((project) => ({
        key: `project-${project.id}`,
        type: "Project",
        label: project.name,
        detail: `${project.code} · ${project.location}`,
        href: `/app/projects/${project.id}/overview`,
      }));
    const taskResults = projects.flatMap((project) =>
      project.tasks
        .filter((task) => task.title.toLowerCase().includes(query))
        .map((task) => ({
          key: `task-${task.id}`,
          type: "Task",
          label: task.title,
          detail: `${project.name} · ${task.progress}%`,
          href: `/app/projects/${project.id}/schedule?task=${encodeURIComponent(task.id)}`,
        })),
    );

    return [...projectResults, ...taskResults].slice(0, 8);
  }, [projects, searchQuery]);
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setUserMenuOpen(false);
        setSwitcherOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function openSearchResult(href: string) {
    setSearchQuery("");
    setSearchOpen(false);
    router.push(href);
  }

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
          <div className="global-search-wrap">
            <label className="global-search">
              <Search aria-hidden="true" size={17} />
              <span className="sr-only">Search Planisher</span>
              <input
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && searchResults[0]) {
                    event.preventDefault();
                    openSearchResult(searchResults[0].href);
                  }
                }}
                placeholder="Search projects and tasks…"
                ref={searchInputRef}
                value={searchQuery}
              />
              <kbd>Ctrl K</kbd>
            </label>
            {searchOpen && searchQuery.trim() ? (
              <div
                aria-label="Search results"
                className="global-search-results"
                role="listbox"
              >
                {searchResults.length ? (
                  searchResults.map((result) => (
                    <button
                      aria-selected="false"
                      key={result.key}
                      onClick={() => openSearchResult(result.href)}
                      role="option"
                      type="button"
                    >
                      <span className="search-result-type">{result.type}</span>
                      <span>
                        <strong>{result.label}</strong>
                        <small>{result.detail}</small>
                      </span>
                    </button>
                  ))
                ) : (
                  <p>No matching projects or tasks.</p>
                )}
              </div>
            ) : null}
          </div>
          <LocaleSummary />
          <div className="topbar-user">
            <button
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              className="topbar-user-button"
              onClick={() => setUserMenuOpen((open) => !open)}
              type="button"
            >
              <span className="topbar-avatar" aria-hidden="true">
                AK
              </span>
              <span className="topbar-user-copy">
                <strong>Amina Khan</strong>
                <small>Project lead</small>
              </span>
              <ChevronDown
                aria-hidden="true"
                className={userMenuOpen ? "chevron-open" : ""}
                size={15}
              />
            </button>
            {userMenuOpen ? (
              <div className="topbar-user-menu" role="menu">
                <span className="workspace-menu-label">Local demo account</span>
                <Link
                  href="/app"
                  onClick={() => setUserMenuOpen(false)}
                  role="menuitem"
                >
                  <LayoutDashboard aria-hidden="true" size={15} />
                  My dashboard
                </Link>
                <Link
                  href="/app/settings/local"
                  onClick={() => setUserMenuOpen(false)}
                  role="menuitem"
                >
                  <UserRound aria-hidden="true" size={15} />
                  Profile and preferences
                </Link>
                <div className="local-session-note">
                  <Sparkles aria-hidden="true" size={14} />
                  Signed in locally · no login required
                </div>
              </div>
            ) : null}
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
