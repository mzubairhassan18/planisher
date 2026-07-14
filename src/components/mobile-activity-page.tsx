"use client";

import { Activity, ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useLocalStore } from "@/components/local-store";

export function MobileActivityPage() {
  const { activity, currentUser, members, openActivity, projects } = useLocalStore();
  const [query, setQuery] = useState("");
  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return activity.filter((item) => {
      const project = projects.find((candidate) => candidate.id === item.projectId);
      return (
        !normalized ||
        item.action.toLowerCase().includes(normalized) ||
        item.detail.toLowerCase().includes(normalized) ||
        project?.name.toLowerCase().includes(normalized)
      );
    });
  }, [activity, projects, query]);

  return (
    <div className="mobile-activity-screen">
      <header className="page-heading">
        <span className="eyebrow">Workspace record</span>
        <h1>Activity</h1>
        <p>Open any update to return to the related project, task, or comment.</p>
      </header>
      <label className="mobile-search-field">
        <Search aria-hidden="true" size={17} />
        <span className="sr-only">Search activity</span>
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search activity…"
          value={query}
        />
      </label>
      <section className="mobile-activity-list">
        {items.length ? items.map((item) => {
          const member = members.find((candidate) => candidate.id === item.actorId) ?? currentUser;
          const project = projects.find((candidate) => candidate.id === item.projectId);
          return (
            <button key={item.id} onClick={() => openActivity(item.id)} type="button">
              <span className="avatar" style={{ backgroundColor: member.color }}>{member.initials}</span>
              <span>
                <strong>{member.name} {item.action}</strong>
                <small>{item.detail}</small>
                <em>{project?.name ?? "Project"} · {new Date(item.occurredAt).toLocaleString()}</em>
              </span>
              <ArrowRight aria-hidden="true" size={16} />
            </button>
          );
        }) : (
          <div className="mobile-empty-list">
            <Activity aria-hidden="true" size={24} />
            <strong>No activity found</strong>
            <span>Updates will appear here after project work begins.</span>
          </div>
        )}
      </section>
    </div>
  );
}
