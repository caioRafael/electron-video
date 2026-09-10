import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { AssetKind } from '../shared/assets'
import {
  getAssetPreview,
  importWorkspaceAssetPaths,
  importWorkspaceAssets,
  listWorkspaceAssets,
  renameWorkspaceAsset,
} from './assets'
import {
  createWorkspace,
  getDirectoryPath,
  listWorkspaceFiles,
  listWorkspaces,
} from './workspace'

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
    (_event, workspacePath: string, assetPath: string, nextName: string) => {
      return renameWorkspaceAsset(workspacePath, assetPath, nextName)
    },
  )
  ipcMain.handle(
    'get-asset-preview',
    (_event, workspacePath: string, assetPath: string) => {
      return getAssetPreview(workspacePath, assetPath)
    },
  )

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
