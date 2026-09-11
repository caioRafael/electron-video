import { stat } from 'node:fs/promises'
import path from 'node:path'
import { Asset } from '../../shared/assets'
import { isWorkspaceAssetFile, resolveAssetSource } from '../asset-path'
import { pathExists } from '../fs'
import { readWorkspaceMarker } from '../workspace-marker'

export async function getWorkspaceAssetById(
  workspacePath: string,
  assetId: string,
): Promise<Asset> {
  if (typeof assetId !== 'string' || assetId.length === 0) {
    throw new Error('Invalid asset')
  }

  const marker = await readWorkspaceMarker(workspacePath)
  const asset = marker?.assets.find((item) => item.id === assetId)

  if (!asset) {
    throw new Error('Asset not found')
  }

  return asset
}

export async function resolveAssetFilePath(
  workspacePath: string,
  assetId: string,
): Promise<string> {
  const asset = await getWorkspaceAssetById(workspacePath, assetId)

  let resolvedAssetPath: string

  try {
    resolvedAssetPath = path.resolve(
      resolveAssetSource(workspacePath, asset.source),
    )
  } catch {
    throw new Error('Invalid asset source')
  }

  if (!isWorkspaceAssetFile(workspacePath, resolvedAssetPath)) {
    throw new Error('Invalid asset source')
  }

  if (!(await pathExists(resolvedAssetPath))) {
    throw new Error('Asset not found')
  }

  const fileStat = await stat(resolvedAssetPath)

  if (!fileStat.isFile()) {
    throw new Error('Asset not found')
  }

  return resolvedAssetPath
}
