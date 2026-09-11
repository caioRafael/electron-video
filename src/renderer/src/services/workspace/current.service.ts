export function setCurrentWorkspace(workspacePath: string): Promise<void> {
  return window.api.workspace.setCurrent(workspacePath)
}

export function clearCurrentWorkspace(): Promise<void> {
  return window.api.workspace.clearCurrent()
}
