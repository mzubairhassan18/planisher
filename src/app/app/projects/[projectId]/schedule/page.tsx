import { ProjectScheduleView } from "@/components/project-schedule-view";

export default async function ProjectSchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ task?: string; open?: string; comment?: string }>;
}) {
  const { projectId } = await params;
  const { task, open, comment } = await searchParams;
  return (
    <ProjectScheduleView
      focusCommentId={comment}
      focusTaskId={task}
      openTaskOnLoad={open === "1"}
      projectId={projectId}
    />
  );
}
