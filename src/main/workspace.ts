import { app, dialog, OpenDialogOptions } from 'electron'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Workspace, WorkspaceEntry } from '../shared/workspace'
import { ensureAssetFolders } from './assets'
import { pathExists } from './fs'
import { createWorkspaceMarker, writeWorkspaceMarker } from './workspace-marker'

const REGISTRY_FILE = 'workspaces.json'

function getRegistryPath(): string {
  return path.join(app.getPath('userData'), REGISTRY_FILE)
}

function isWorkspace(value: unknown): value is Workspace {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const workspace = value as Record<string, unknown>

  return (
    typeof workspace.id === 'string' &&
    typeof workspace.name === 'string' &&
    typeof workspace.path === 'string' &&
    typeof workspace.updatedAt === 'string'
  )
}

async function readRegistry(): Promise<Workspace[]> {
  try {
    const content = await readFile(getRegistryPath(), 'utf8')
    const parsed: unknown = JSON.parse(content)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isWorkspace)
  } catch {
    return []
  }
}

async function writeRegistry(workspaces: Workspace[]): Promise<void> {
  await writeFile(
    getRegistryPath(),
    JSON.stringify(workspaces, null, 2),
    'utf8',
  )
}

export async function getDirectoryPath(): Promise<string | null> {
  const dialogOptions: OpenDialogOptions = {
    title: 'Selecione o diretório do workspace',
    properties: ['openDirectory', 'createDirectory'],
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, 50)
  })

  const result = await dialog.showOpenDialog(dialogOptions)

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
}

export async function createWorkspace(
  parentDirectory: string,
  name: string,
): Promise<Workspace> {
  const workspaceName = name.trim()
  const workspacePath = path.join(parentDirectory, workspaceName)

  await mkdir(workspacePath)
  await ensureAssetFolders(workspacePath)

  const workspace: Workspace = {
    id: randomUUID(),
    name: workspaceName,
    path: workspacePath,
    updatedAt: new Date().toISOString(),
  }

  await writeWorkspaceMarker(
    workspacePath,
    createWorkspaceMarker(workspace.id, workspace.name),
  )

  const workspaces = await readRegistry()
  const nextWorkspaces = [
    workspace,
    ...workspaces.filter((item) => item.path !== workspace.path),
  ]

  await writeRegistry(nextWorkspaces)

  return workspace
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const workspaces = await readRegistry()
  const existingWorkspaces: Workspace[] = []

  for (const workspace of workspaces) {
    if (await pathExists(workspace.path)) {
      existingWorkspaces.push(workspace)
    }
  }

  if (existingWorkspaces.length !== workspaces.length) {
    await writeRegistry(existingWorkspaces)
  }

  return existingWorkspaces
}

async function readDirectoryEntries(
  directoryPath: string,
): Promise<WorkspaceEntry[]> {
  const dirents = await readdir(directoryPath, { withFileTypes: true })
  const entries: WorkspaceEntry[] = []

  for (const dirent of dirents) {
    if (dirent.name.startsWith('.')) {
      continue
    }

    const entryPath = path.join(directoryPath, dirent.name)
    const isDirectory = dirent.isDirectory()

    entries.push({
      name: dirent.name,
      path: entryPath,
      isDirectory,
      children: isDirectory ? await readDirectoryEntries(entryPath) : [],
    })
  }

  return entries.sort((left, right) => {
    if (left.isDirectory !== right.isDirectory) {
      return left.isDirectory ? -1 : 1
    }

    return left.name.localeCompare(right.name, 'pt-BR')
  })
}

export async function listWorkspaceFiles(
  workspacePath: string,
): Promise<WorkspaceEntry[]> {
  if (!(await pathExists(workspacePath))) {
    return []
  }

  return readDirectoryEntries(workspacePath)
}
