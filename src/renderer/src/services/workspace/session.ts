import {
  Asset,
  AssetKind,
  EMPTY_WORKSPACE_ASSETS,
  ImportAssetsResult,
} from '@shared/assets'
import { Project } from '@shared/project'
import {
  Clip,
  appendAssetToTimeline,
  removeClipFromTimeline,
  reorderClipInTimeline,
  replaceClipInTimeline,
} from '@shared/timeline'
import { Workspace } from '@shared/workspace'
import { getWorkspaceProject } from '@/services/project/get.service'
import { updateWorkspaceProjectTimeline } from '@/services/project/update-timeline.service'
import { updateWorkspaceProject } from '@/services/project/update.service'
import {
  clearCurrentWorkspace,
  setCurrentWorkspace,
} from '@/services/workspace/current.service'
import { createWorkspace } from '@/services/workspace/create.service'
import { importWorkspaceAssetPaths } from '@/services/workspace/import-asset-paths.service'
import { importWorkspaceAssets } from '@/services/workspace/import-assets.service'
import { listWorkspaceAssets } from '@/services/workspace/list-assets.service'
import { listWorkspaces } from '@/services/workspace/list.service'
import { renameWorkspaceAsset } from '@/services/workspace/rename-asset.service'
import { useWorkspaceStore } from '@/stores/workspace.store'

export async function refreshWorkspaces(): Promise<void> {
  const workspaces = await listWorkspaces()
  useWorkspaceStore.getState().setWorkspaces(workspaces)
}

export async function selectWorkspace(workspace: Workspace): Promise<void> {
  await setCurrentWorkspace(workspace.path)

  try {
    const project = await getWorkspaceProject(workspace.path)
    const assets = await listWorkspaceAssets(workspace.path)

    useWorkspaceStore.getState().setCurrentWorkspace(workspace)
    useWorkspaceStore.getState().setCurrentProject(project)
    useWorkspaceStore.getState().setAssets(assets)
  } catch (error) {
    await clearCurrentWorkspace()
    throw error
  }
}

export async function createAndSelectWorkspace(
  parentDirectory: string,
  name: string,
): Promise<void> {
  const workspace = await createWorkspace(parentDirectory, name)

  await refreshWorkspaces()
  await selectWorkspace(workspace)
}

export async function importAssetsIntoCurrentWorkspace(
  kind?: AssetKind,
): Promise<ImportAssetsResult | null> {
  const workspace = useWorkspaceStore.getState().currentWorkspace

  if (!workspace) {
    return null
  }

  const result = await importWorkspaceAssets(workspace.path, kind)

  if (!result.canceled) {
    useWorkspaceStore.getState().setAssets(result.assets)
  }

  return result
}

export async function importAssetPathsIntoCurrentWorkspace(
  filePaths: string[],
): Promise<ImportAssetsResult | null> {
  const workspace = useWorkspaceStore.getState().currentWorkspace

  if (!workspace || filePaths.length === 0) {
    return null
  }

  const result = await importWorkspaceAssetPaths(workspace.path, filePaths)

  if (!result.canceled) {
    useWorkspaceStore.getState().setAssets(result.assets)
  }

  return result
}

export function getImportAssetsError(
  result: ImportAssetsResult | null,
): string {
  if (!result || result.canceled) {
    return ''
  }

  if (result.imported.length === 0 && result.skipped.length > 0) {
    return 'Nenhum arquivo suportado. Use áudio, vídeo ou imagem.'
  }

  return ''
}

export async function renameAssetInCurrentWorkspace(
  assetId: string,
  nextName: string,
): Promise<void> {
  const workspace = useWorkspaceStore.getState().currentWorkspace

  if (!workspace) {
    return
  }

  const assets = await renameWorkspaceAsset(workspace.path, assetId, nextName)

  useWorkspaceStore.getState().setAssets(assets)
}

export function getRenameAssetError(error: unknown): string {
  const message = error instanceof Error ? error.message : ''

  if (message.includes('Asset name already exists')) {
    return 'Já existe um arquivo com esse nome'
  }

  if (message.includes('Invalid asset name')) {
    return 'Informe um nome válido'
  }

  return 'Não foi possível renomear o arquivo'
}

export function getProjectError(error: unknown): string {
  const message = error instanceof Error ? error.message : ''

  if (message.includes('Invalid project file')) {
    return 'O arquivo do projeto está inválido'
  }

  return 'Não foi possível abrir o projeto'
}

export async function updateCurrentProjectName(name: string): Promise<void> {
  const workspace = useWorkspaceStore.getState().currentWorkspace

  if (!workspace) {
    return
  }

  const project = await updateWorkspaceProject(workspace.path, { name })

  useWorkspaceStore.getState().setCurrentProject(project)
}

export async function addAssetToCurrentTimeline(asset: Asset): Promise<void> {
  const workspace = useWorkspaceStore.getState().currentWorkspace
  const project = useWorkspaceStore.getState().currentProject

  if (!workspace || !project) {
    return
  }

  const timeline = appendAssetToTimeline(project.timeline, asset)
  const nextProject = await updateWorkspaceProjectTimeline(workspace.path, {
    timeline,
  })

  useWorkspaceStore.getState().setCurrentProject(nextProject)
}

export function getAddAssetToTimelineError(error: unknown): string {
  const message = error instanceof Error ? error.message : ''

  if (message.includes('Invalid project')) {
    return 'Não foi possível atualizar a timeline'
  }

  return 'Não foi possível adicionar o arquivo à timeline'
}

async function persistCurrentTimeline(
  project: Project,
  workspacePath: string,
  timeline: Project['timeline'],
): Promise<void> {
  useWorkspaceStore.getState().setCurrentProject({
    ...project,
    timeline,
  })

  try {
    const nextProject = await updateWorkspaceProjectTimeline(workspacePath, {
      timeline,
    })

    useWorkspaceStore.getState().setCurrentProject(nextProject)
  } catch (error) {
    useWorkspaceStore.getState().setCurrentProject(project)
    throw error
  }
}

export async function replaceClipInCurrentTimeline(
  nextClip: Clip,
): Promise<void> {
  const workspace = useWorkspaceStore.getState().currentWorkspace
  const project = useWorkspaceStore.getState().currentProject

  if (!workspace || !project) {
    return
  }

  await persistCurrentTimeline(
    project,
    workspace.path,
    replaceClipInTimeline(project.timeline, nextClip),
  )
}

export async function reorderClipInCurrentTimeline(
  clipId: string,
  desiredStart: number,
): Promise<void> {
  const workspace = useWorkspaceStore.getState().currentWorkspace
  const project = useWorkspaceStore.getState().currentProject

  if (!workspace || !project) {
    return
  }

  const timeline = reorderClipInTimeline(project.timeline, clipId, desiredStart)

  if (timeline === project.timeline) {
    return
  }

  const orderUnchanged = project.timeline.tracks.every((track, index) => {
    return track === timeline.tracks[index]
  })

  if (orderUnchanged) {
    return
  }

  await persistCurrentTimeline(project, workspace.path, timeline)
}

export async function removeClipFromCurrentTimeline(
  clipId: string,
): Promise<void> {
  const workspace = useWorkspaceStore.getState().currentWorkspace
  const project = useWorkspaceStore.getState().currentProject

  if (!workspace || !project) {
    return
  }

  await persistCurrentTimeline(
    project,
    workspace.path,
    removeClipFromTimeline(project.timeline, clipId),
  )
}

export async function closeWorkspace(): Promise<void> {
  await clearCurrentWorkspace()
  useWorkspaceStore.getState().setCurrentWorkspace(null)
  useWorkspaceStore.getState().setCurrentProject(null)
  useWorkspaceStore.getState().setAssets(EMPTY_WORKSPACE_ASSETS)
}
