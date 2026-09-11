import { createAssetMediaUrl, MediaSource } from '../../shared/media'
import { requireCurrentWorkspacePath } from '../workspace-session'
import { resolveAssetFilePath } from './asset-resolver'

export async function getMediaSource(assetId: string): Promise<MediaSource> {
  const workspacePath = await requireCurrentWorkspacePath()

  await resolveAssetFilePath(workspacePath, assetId)

  return {
    url: createAssetMediaUrl(assetId),
  }
}
