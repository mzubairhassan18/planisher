import { ProjectSectionView } from "@/components/project-section-view";

export default async function ProjectBudgetPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectSectionView projectId={projectId} section="budget" />;
}
