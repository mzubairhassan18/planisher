import type { TeamMember } from "@/lib/types";

export function AvatarStack({
  members,
  limit = 3,
}: {
  members: TeamMember[];
  limit?: number;
}) {
  const visible = members.slice(0, limit);
  const remainder = members.length - visible.length;

  return (
    <div className="avatar-stack" aria-label={members.map((m) => m.name).join(", ")}>
      {visible.map((member) => (
        <span
          className="avatar"
          key={member.id}
          style={{ backgroundColor: member.color }}
          title={`${member.name}, ${member.role}`}
        >
          {member.initials}
        </span>
      ))}
      {remainder > 0 ? <span className="avatar avatar-more">+{remainder}</span> : null}
    </div>
  );
}
