import {
  AssetKind,
  EMPTY_WORKSPACE_ASSETS,
  ImportAssetsResult,
} from '@shared/assets'
import { Workspace } from '@shared/workspace'
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
  const assets = await listWorkspaceAssets(workspace.path)

  useWorkspaceStore.getState().setCurrentWorkspace(workspace)
  useWorkspaceStore.getState().setAssets(assets)
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
  assetPath: string,
  nextName: string,
): Promise<void> {
  const workspace = useWorkspaceStore.getState().currentWorkspace

  if (!workspace) {
    return
  }

  const assets = await renameWorkspaceAsset(workspace.path, assetPath, nextName)

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

export function closeWorkspace(): void {
  useWorkspaceStore.getState().setCurrentWorkspace(null)
  useWorkspaceStore.getState().setAssets(EMPTY_WORKSPACE_ASSETS)
}
