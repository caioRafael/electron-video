import { ElectronAPI } from '@electron-toolkit/preload'
import {
  AssetKind,
  ImportAssetsResult,
  WorkspaceAssets,
} from '../shared/assets'
import { Workspace, WorkspaceEntry } from '../shared/workspace'

interface WorkspaceApi {
  getDirectoryPath: () => Promise<string | null>
  create: (parentDirectory: string, name: string) => Promise<Workspace>
  list: () => Promise<Workspace[]>
  listFiles: (workspacePath: string) => Promise<WorkspaceEntry[]>
  listAssets: (workspacePath: string) => Promise<WorkspaceAssets>
  importAssets: (
    workspacePath: string,
    kind?: AssetKind,
  ) => Promise<ImportAssetsResult>
  importAssetPaths: (
    workspacePath: string,
    filePaths: string[],
  ) => Promise<ImportAssetsResult>
  renameAsset: (
    workspacePath: string,
    assetPath: string,
    nextName: string,
  ) => Promise<WorkspaceAssets>
  getAssetPreview: (
    workspacePath: string,
    assetPath: string,
  ) => Promise<string | null>
}

interface AppApi {
  getPathForFile: (file: File) => string
  workspace: WorkspaceApi
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppApi
  }
}

export {}
