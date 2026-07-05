import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone?: "neutral" | "blue" | "red" | "green";
}) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-icon">
        <Icon aria-hidden="true" size={18} />
      </div>
      <div>
        <span className="metric-label">{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}
