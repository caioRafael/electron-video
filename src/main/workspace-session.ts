import path from 'node:path'
import { pathExists } from './fs'

let currentWorkspacePath: string | null = null

export async function setCurrentWorkspacePath(
  workspacePath: string,
): Promise<void> {
  if (typeof workspacePath !== 'string' || workspacePath.length === 0) {
    throw new Error('Workspace not found')
  }

  const resolvedPath = path.resolve(workspacePath)

  if (!(await pathExists(resolvedPath))) {
    throw new Error('Workspace not found')
  }

  currentWorkspacePath = resolvedPath
}

export function getCurrentWorkspacePath(): string | null {
  return currentWorkspacePath
}

export function clearCurrentWorkspacePath(): void {
  currentWorkspacePath = null
}

export async function requireCurrentWorkspacePath(): Promise<string> {
  if (!currentWorkspacePath) {
    throw new Error('Workspace not found')
  }

  if (!(await pathExists(currentWorkspacePath))) {
    currentWorkspacePath = null
    throw new Error('Workspace not found')
  }

  return currentWorkspacePath
}
