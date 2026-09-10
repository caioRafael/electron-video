import { create } from 'zustand'
import { Workspace, WorkspaceEntry } from '@shared/workspace'

interface WorkspaceStore {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  files: WorkspaceEntry[]
  setCurrentWorkspace: (currentWorkspace: Workspace | null) => void
  setWorkspaces: (workspaces: Workspace[]) => void
  setFiles: (files: WorkspaceEntry[]) => void
}

export const useWorkspaceStore = create<WorkspaceStore>()((set) => ({
  currentWorkspace: null,
  workspaces: [],
  files: [],
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setFiles: (files) => set({ files }),
}))
