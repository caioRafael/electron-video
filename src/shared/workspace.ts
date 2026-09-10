export interface Workspace {
  id: string
  name: string
  path: string
  updatedAt: string
}

export interface WorkspaceEntry {
  name: string
  path: string
  isDirectory: boolean
  children: WorkspaceEntry[]
}
