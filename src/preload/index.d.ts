import { ElectronAPI } from '@electron-toolkit/preload'
import {
  AssetKind,
  ImportAssetsResult,
  WorkspaceAssets,
} from '../shared/assets'
import { MediaRuntimeInfo } from '../shared/media'
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
    assetId: string,
    nextName: string,
  ) => Promise<WorkspaceAssets>
  getAssetPreview: (
    workspacePath: string,
    assetId: string,
  ) => Promise<string | null>
}

interface MediaApi {
  getRuntimeInfo: () => Promise<MediaRuntimeInfo>
}

interface AppApi {
  getPathForFile: (file: File) => string
  workspace: WorkspaceApi
  media: MediaApi
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppApi
  }
}

export {}
