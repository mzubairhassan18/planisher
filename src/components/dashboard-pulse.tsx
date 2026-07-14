"use client";

import { useEffect, useMemo, useState } from "react";

interface PulseSegment {
  color: string;
  label: string;
  value: number;
}

export function LiveGreetingClock({ firstName }: { firstName: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const current = now ?? new Date();
  const hour = current.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(current);
  const formattedTime = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(current);

  return (
    <div>
      <span className="eyebrow dashboard-date-time">
        <span>{formattedDate}</span>
        <span aria-hidden="true">•</span>
        <time dateTime={current.toISOString()}>{formattedTime}</time>
      </span>
      <h1>
        {greeting}, {firstName}.
      </h1>
      <p>Here is what needs your attention across the build programme.</p>
    </div>
  );
}

export function PortfolioDonut({ segments }: { segments: PulseSegment[] }) {
  const positiveSegments = segments.filter((segment) => segment.value > 0);
  const total = positiveSegments.reduce((sum, segment) => sum + segment.value, 0);
  const gradient = useMemo(() => {
    if (!total) return "conic-gradient(var(--line) 0 100%)";
    let offset = 0;
    return `conic-gradient(${positiveSegments
      .map((segment) => {
        const start = offset;
        offset += (segment.value / total) * 100;
        return `${segment.color} ${start}% ${offset}%`;
      })
      .join(", ")})`;
  }, [positiveSegments, total]);

  return (
    <article className="content-card portfolio-pulse-card">
      <div>
        <span className="eyebrow">Portfolio pulse</span>
        <h2>Work at a glance</h2>
        <p>A quick balance of projects and near-term task outcomes.</p>
      </div>
      <div className="portfolio-donut-layout">
        <div
          aria-label={segments
            .map((segment) => `${segment.label}: ${segment.value}`)
            .join(", ")}
          className="portfolio-donut"
          role="img"
          style={{ background: gradient }}
        >
          <span>
            <strong>{total}</strong>
            <small>signals</small>
          </span>
        </div>
        <ul className="portfolio-donut-legend">
          {segments.map((segment) => (
            <li key={segment.label}>
              <i style={{ backgroundColor: segment.color }} />
              <span>{segment.label}</span>
              <strong>{segment.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
