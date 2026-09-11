import { create } from 'zustand'
import {
  AssetViewMode,
  EMPTY_WORKSPACE_ASSETS,
  WorkspaceAssets,
} from '@shared/assets'
import { Project } from '@shared/project'
import { Workspace } from '@shared/workspace'

interface WorkspaceStore {
  currentWorkspace: Workspace | null
  currentProject: Project | null
  workspaces: Workspace[]
  assets: WorkspaceAssets
  assetViewMode: AssetViewMode
  setCurrentWorkspace: (currentWorkspace: Workspace | null) => void
  setCurrentProject: (currentProject: Project | null) => void
  setWorkspaces: (workspaces: Workspace[]) => void
  setAssets: (assets: WorkspaceAssets) => void
  setAssetViewMode: (assetViewMode: AssetViewMode) => void
}

export const useWorkspaceStore = create<WorkspaceStore>()((set) => ({
  currentWorkspace: null,
  currentProject: null,
  workspaces: [],
  assets: EMPTY_WORKSPACE_ASSETS,
  assetViewMode: 'list',
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setAssets: (assets) => set({ assets }),
  setAssetViewMode: (assetViewMode) => set({ assetViewMode }),
}))
