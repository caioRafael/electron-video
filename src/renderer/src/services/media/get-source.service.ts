import { MediaSource } from '@shared/media'

export function getMediaSource(assetId: string): Promise<MediaSource> {
  return window.api.media.getSource(assetId)
}
