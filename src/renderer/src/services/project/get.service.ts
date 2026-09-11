import { Project } from '@shared/project'

export function getWorkspaceProject(workspacePath: string): Promise<Project> {
  return window.api.project.get(workspacePath)
}
