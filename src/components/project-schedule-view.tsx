"use client";

import Link from "next/link";

import { NewTaskButton } from "@/components/action-buttons";
import { useLocalStore } from "@/components/local-store";
import { ProjectWorkspace } from "@/components/project-workspace";
import { ScheduleGantt } from "@/components/schedule-gantt";
import { localToday } from "@/lib/mock-data";

export function ProjectScheduleView({ projectId }: { projectId: string }) {
  const { openNewTask, openTask, projects, updateTask } = useLocalStore();
  const project = projects.find((item) => item.id === projectId);

  if (!project) {
    return (
      <article className="content-card placeholder-card">
        <h2>Project not found</h2>
        <Link className="text-link" href="/app/projects">
          Return to projects
        </Link>
      </article>
    );
  }

  return (
    <ProjectWorkspace
      actions={<NewTaskButton className="secondary-button" projectId={project.id} />}
      activeTab="schedule"
      project={project}
    >
      <div className="status-legend" aria-label="Schedule status legend">
        <span>
          <i className="legend-dot on-time" /> On time
        </span>
        <span>
          <i className="legend-dot delayed" /> Delayed
        </span>
        <span>
          <i className="legend-dot completed" /> Completed
        </span>
        <span>
          <i className="legend-dot not-started" /> Not started
        </span>
      </div>

      <ScheduleGantt
        onAddTask={() => openNewTask(project.id)}
        onSelectTask={(taskId) => openTask(project.id, taskId)}
        onUpdateProgress={(taskId, progress) =>
          updateTask(project.id, taskId, { progress })
        }
        project={project}
        today={localToday}
      />
    </ProjectWorkspace>
  );
}
