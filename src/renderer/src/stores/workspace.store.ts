import { create } from 'zustand'
import {
  AssetViewMode,
  EMPTY_WORKSPACE_ASSETS,
  WorkspaceAssets,
} from '@shared/assets'
import { Workspace } from '@shared/workspace'

interface WorkspaceStore {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  assets: WorkspaceAssets
  assetViewMode: AssetViewMode
  setCurrentWorkspace: (currentWorkspace: Workspace | null) => void
  setWorkspaces: (workspaces: Workspace[]) => void
  setAssets: (assets: WorkspaceAssets) => void
  setAssetViewMode: (assetViewMode: AssetViewMode) => void
}

export const useWorkspaceStore = create<WorkspaceStore>()((set) => ({
  currentWorkspace: null,
  workspaces: [],
  assets: EMPTY_WORKSPACE_ASSETS,
  assetViewMode: 'list',
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setAssets: (assets) => set({ assets }),
  setAssetViewMode: (assetViewMode) => set({ assetViewMode }),
}))
