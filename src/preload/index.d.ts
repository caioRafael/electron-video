import { ElectronAPI } from '@electron-toolkit/preload'
import { Workspace, WorkspaceEntry } from '../shared/workspace'

interface WorkspaceApi {
  getDirectoryPath: () => Promise<string | null>
  create: (parentDirectory: string, name: string) => Promise<Workspace>
  list: () => Promise<Workspace[]>
  listFiles: (workspacePath: string) => Promise<WorkspaceEntry[]>
}

interface AppApi {
  workspace: WorkspaceApi
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppApi
  }
}

export {}
