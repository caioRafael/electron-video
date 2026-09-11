import { Project, UpdateProjectInput } from '@shared/project'

export function updateWorkspaceProject(
  workspacePath: string,
  input: UpdateProjectInput,
): Promise<Project> {
  return window.api.project.update(workspacePath, input)
}
