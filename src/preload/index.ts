import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
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
