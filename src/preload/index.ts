import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getPathForFile: (file: File): string => {
    return webUtils.getPathForFile(file)
  },
  workspace: {
    getDirectoryPath: (): Promise<string | null> => {
      return ipcRenderer.invoke('get-directory-path')
    },
    create: (parentDirectory: string, name: string) => {
      return ipcRenderer.invoke('create-workspace', parentDirectory, name)
    },
    list: () => {
      return ipcRenderer.invoke('list-workspaces')
    },
    listFiles: (workspacePath: string) => {
      return ipcRenderer.invoke('list-workspace-files', workspacePath)
    },
    listAssets: (workspacePath: string) => {
      return ipcRenderer.invoke('list-workspace-assets', workspacePath)
    },
    importAssets: (
      workspacePath: string,
      kind?: 'audio' | 'video' | 'image',
    ) => {
      return ipcRenderer.invoke('import-workspace-assets', workspacePath, kind)
    },
    importAssetPaths: (workspacePath: string, filePaths: string[]) => {
      return ipcRenderer.invoke(
        'import-workspace-asset-paths',
        workspacePath,
        filePaths,
      )
    },
    renameAsset: (
      workspacePath: string,
      assetPath: string,
      nextName: string,
    ) => {
      return ipcRenderer.invoke(
        'rename-workspace-asset',
        workspacePath,
        assetPath,
        nextName,
      )
    },
    getAssetPreview: (workspacePath: string, assetPath: string) => {
      return ipcRenderer.invoke('get-asset-preview', workspacePath, assetPath)
    },
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  Object.assign(window, {
    electron: electronAPI,
    api,
  })
}
