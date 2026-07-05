import { ProjectScheduleView } from "@/components/project-schedule-view";

export default async function ProjectSchedulePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectScheduleView projectId={projectId} />;
}
