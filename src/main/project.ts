import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  Project,
  UpdateProjectInput,
  normalizeProject,
} from '../shared/project'
import { pathExists } from './fs'
import { readWorkspaceMarker } from './workspace-marker'

export const PROJECT_FILE = 'project.json'

function getProjectPath(workspacePath: string): string {
  return path.join(workspacePath, PROJECT_FILE)
}

function createProjectId(): string {
  return `project_${randomUUID()}`
}

function createProject(name: string): Project {
  const now = new Date().toISOString()

  return {
    id: createProjectId(),
    name,
    createdAt: now,
    updatedAt: now,
  }
}

function serializeProject(project: Project): Project {
  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
}

async function getDefaultProjectName(workspacePath: string): Promise<string> {
  const marker = await readWorkspaceMarker(workspacePath)
  const name = marker?.name.trim() || path.basename(workspacePath).trim()

  return name || 'Meu Projeto'
}

async function writeWorkspaceProject(
  workspacePath: string,
  project: Project,
): Promise<void> {
  await writeFile(
    getProjectPath(workspacePath),
    JSON.stringify(serializeProject(project), null, 2),
    'utf8',
  )
}

async function readWorkspaceProject(workspacePath: string): Promise<Project> {
  let parsed: unknown

  try {
    const content = await readFile(getProjectPath(workspacePath), 'utf8')
    parsed = JSON.parse(content)
  } catch {
    throw new Error('Invalid project file')
  }

  const project = normalizeProject(parsed)

  if (!project) {
    throw new Error('Invalid project file')
  }

  return project
}

export async function ensureWorkspaceProject(
  workspacePath: string,
  name?: string,
): Promise<Project> {
  if (!(await pathExists(workspacePath))) {
    throw new Error('Workspace not found')
  }

  if (await pathExists(getProjectPath(workspacePath))) {
    return readWorkspaceProject(workspacePath)
  }

  const projectName =
    name?.trim() || (await getDefaultProjectName(workspacePath))
  const project = createProject(projectName)

  await writeWorkspaceProject(workspacePath, project)

  return project
}

export async function getWorkspaceProject(
  workspacePath: string,
): Promise<Project> {
  return ensureWorkspaceProject(workspacePath)
}

export async function updateWorkspaceProject(
  workspacePath: string,
  input: UpdateProjectInput,
): Promise<Project> {
  if (typeof workspacePath !== 'string' || typeof input?.name !== 'string') {
    throw new Error('Invalid project')
  }

  const name = input.name.trim()

  if (!name) {
    throw new Error('Invalid project name')
  }

  const project = await getWorkspaceProject(workspacePath)
  const nextProject: Project = {
    id: project.id,
    name,
    createdAt: project.createdAt,
    updatedAt: new Date().toISOString(),
  }

  await writeWorkspaceProject(workspacePath, nextProject)

  return nextProject
}
