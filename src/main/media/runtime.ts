import { MediaRuntimeInfo } from '../../shared/media'
import { getFFmpegVersion } from './ffmpeg'
import { getFFprobeVersion } from './ffprobe'
import { getFFmpegPath, getFFprobePath, getMediaPlatformKey } from './paths'

export { getFFmpegPath, getFFprobePath, getMediaPlatformKey } from './paths'

export async function getMediaRuntimeInfo(): Promise<MediaRuntimeInfo> {
  const ffmpegPath = getFFmpegPath()
  const ffprobePath = getFFprobePath()
  const platform = getMediaPlatformKey()

  let ffmpegVersion: string | null = null
  let ffprobeVersion: string | null = null

  try {
    ffmpegVersion = await getFFmpegVersion(ffmpegPath)
  } catch (error) {
    console.error('[media] failed to read ffmpeg version', error)
  }

  try {
    ffprobeVersion = await getFFprobeVersion(ffprobePath)
  } catch (error) {
    console.error('[media] failed to read ffprobe version', error)
  }

  return {
    ffmpegPath,
    ffprobePath,
    ffmpegVersion,
    ffprobeVersion,
    platform,
    license: platform.startsWith('darwin') ? 'LGPLv2.1+' : 'LGPLv3',
  }
}
