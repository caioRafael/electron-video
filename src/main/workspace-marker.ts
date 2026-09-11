import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  Asset,
  hasStoredAssetMetadata,
  isAsset,
  normalizeAsset,
} from '../shared/assets'

export const WORKSPACE_MARKER = '.video-lab-workspace.json'

export interface WorkspaceMarker {
  id: string
  name: string
  assets: Asset[]
  assetsMissingMetadata: string[]
}

export function getWorkspaceMarkerPath(workspacePath: string): string {
  return path.join(workspacePath, WORKSPACE_MARKER)
}

export function createWorkspaceMarker(
  id: string,
  name: string,
  assets: Asset[] = [],
): WorkspaceMarker {
  return {
    id,
    name,
    assets,
    assetsMissingMetadata: [],
  }
}

function serializeAsset(asset: Asset): Asset {
  return {
    id: asset.id,
    name: asset.name,
    kind: asset.kind,
    source: asset.source,
    createdAt: asset.createdAt,
    metadata: asset.metadata,
  }
}

export async function readWorkspaceMarker(
  workspacePath: string,
): Promise<WorkspaceMarker | null> {
  try {
    const content = await readFile(
      getWorkspaceMarkerPath(workspacePath),
      'utf8',
    )
    const parsed: unknown = JSON.parse(content)

    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }

    const marker = parsed as Record<string, unknown>

    if (typeof marker.id !== 'string' || typeof marker.name !== 'string') {
      return null
    }

    const rawAssets = Array.isArray(marker.assets) ? marker.assets : []
    const assets: Asset[] = []
    const assetsMissingMetadata: string[] = []

    for (const rawAsset of rawAssets) {
      if (!isAsset(rawAsset)) {
        continue
      }

      const asset = normalizeAsset(rawAsset)

      if (!asset) {
        continue
      }

      assets.push(asset)

      if (!hasStoredAssetMetadata(rawAsset)) {
        assetsMissingMetadata.push(asset.id)
      }
    }

    return {
      id: marker.id,
      name: marker.name,
      assets,
      assetsMissingMetadata,
    }
  } catch {
    return null
  }
}

export async function writeWorkspaceMarker(
  workspacePath: string,
  marker: WorkspaceMarker,
): Promise<void> {
  await writeFile(
    getWorkspaceMarkerPath(workspacePath),
    JSON.stringify(
      {
        id: marker.id,
        name: marker.name,
        assets: marker.assets.map(serializeAsset),
      },
      null,
      2,
    ),
    'utf8',
  )
}
