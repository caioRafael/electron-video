export function getDirectoryPath(): Promise<string | null> {
  return window.api.workspace.getDirectoryPath()
}
