import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { AssetKind } from '../shared/assets'
import {
  UpdateProjectInput,
  UpdateProjectTimelineInput,
} from '../shared/project'
import {
  getAssetPreview,
  importWorkspaceAssetPaths,
  importWorkspaceAssets,
  listWorkspaceAssets,
  renameWorkspaceAsset,
} from './assets'
import {
  registerMediaProtocol,
  registerMediaProtocolPrivileges,
} from './media/protocol'
import { getMediaRuntimeInfo } from './media/runtime'
import { getMediaSource } from './media/source'
import {
  getWorkspaceProject,
  updateWorkspaceProject,
  updateWorkspaceProjectTimeline,
} from './project'
import { cancelRenderVideo, promptAndRenderVideo } from './render/render-video'
import {
  createWorkspace,
  getDirectoryPath,
  listWorkspaceFiles,
  listWorkspaces,
} from './workspace'
import {
  clearCurrentWorkspacePath,
  setCurrentWorkspacePath,
} from './workspace-session'

registerMediaProtocolPrivileges()

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file:')) {
      event.preventDefault()
    }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.on('print', (event, message) => {
    console.log(`${event.sender.id} ${message}`)
  })

  ipcMain.handle('get-directory-path', () => getDirectoryPath())
  ipcMain.handle(
    'create-workspace',
    (_event, parentDirectory: string, name: string) => {
      return createWorkspace(parentDirectory, name)
    },
  )
  ipcMain.handle('list-workspaces', () => listWorkspaces())
  ipcMain.handle('list-workspace-files', (_event, workspacePath: string) => {
    return listWorkspaceFiles(workspacePath)
  })
  ipcMain.handle('list-workspace-assets', (_event, workspacePath: string) => {
    return listWorkspaceAssets(workspacePath)
  })
  ipcMain.handle(
    'import-workspace-assets',
    (_event, workspacePath: string, kind?: AssetKind) => {
      return importWorkspaceAssets(workspacePath, kind)
    },
  )
  ipcMain.handle(
    'import-workspace-asset-paths',
    (_event, workspacePath: string, filePaths: string[]) => {
      return importWorkspaceAssetPaths(workspacePath, filePaths)
    },
  )
  ipcMain.handle(
    'rename-workspace-asset',
    (_event, workspacePath: string, assetId: string, nextName: string) => {
      return renameWorkspaceAsset(workspacePath, assetId, nextName)
    },
  )
  ipcMain.handle(
    'get-asset-preview',
    (_event, workspacePath: string, assetId: string) => {
      return getAssetPreview(workspacePath, assetId)
    },
  )
  ipcMain.handle('get-media-runtime-info', () => getMediaRuntimeInfo())
  ipcMain.handle('get-workspace-project', (_event, workspacePath: string) => {
    return getWorkspaceProject(workspacePath)
  })
  ipcMain.handle(
    'update-workspace-project',
    (_event, workspacePath: string, input: UpdateProjectInput) => {
      return updateWorkspaceProject(workspacePath, input)
    },
  )
  ipcMain.handle(
    'update-workspace-project-timeline',
    (_event, workspacePath: string, input: UpdateProjectTimelineInput) => {
      return updateWorkspaceProjectTimeline(workspacePath, input)
    },
  )
  ipcMain.handle('set-current-workspace', (_event, workspacePath: string) => {
    return setCurrentWorkspacePath(workspacePath)
  })
  ipcMain.handle('clear-current-workspace', () => {
    clearCurrentWorkspacePath()
  })
  ipcMain.handle('get-media-source', (_event, assetId: string) => {
    return getMediaSource(assetId)
  })
  ipcMain.handle('render-video', (event) => {
    return promptAndRenderVideo(event.sender)
  })
  ipcMain.handle('cancel-render-video', () => {
    cancelRenderVideo()
  })

  registerMediaProtocol()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
