import { Project, UpdateProjectTimelineInput } from '@shared/project'

export function updateWorkspaceProjectTimeline(
  workspacePath: string,
  input: UpdateProjectTimelineInput,
): Promise<Project> {
  return window.api.project.updateTimeline(workspacePath, input)
}
