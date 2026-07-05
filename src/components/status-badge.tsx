import { Check, CircleDashed, Clock3, TriangleAlert } from "lucide-react";

import type { ScheduleStatus } from "@/lib/types";

const statusContent: Record<
  ScheduleStatus,
  { label: string; icon: typeof Check }
> = {
  completed: { label: "Completed", icon: Check },
  delayed: { label: "Delayed", icon: TriangleAlert },
  on_time: { label: "On time", icon: Clock3 },
  not_started: { label: "Not started", icon: CircleDashed },
};

export function StatusBadge({
  status,
  compact = false,
}: {
  status: ScheduleStatus;
  compact?: boolean;
}) {
  const content = statusContent[status];
  const Icon = content.icon;

  return (
    <span className={`status-badge status-${status}`}>
      <Icon aria-hidden="true" size={compact ? 12 : 14} />
      {compact ? content.label : content.label}
    </span>
  );
}
