import { ProjectScheduleView } from "@/components/project-schedule-view";

export default async function ProjectSchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ task?: string }>;
}) {
  const { projectId } = await params;
  const { task } = await searchParams;
  return <ProjectScheduleView focusTaskId={task} projectId={projectId} />;
}
