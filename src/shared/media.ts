export type MediaPlatformKey =
  | 'darwin-arm64'
  | 'darwin-x64'
  | 'win32-x64'
  | 'win32-arm64'
  | 'linux-x64'
  | 'linux-arm64'

export interface MediaRuntimeInfo {
  ffmpegPath: string
  ffprobePath: string
  ffmpegVersion: string | null
  ffprobeVersion: string | null
  platform: MediaPlatformKey
  license: 'LGPLv2.1+' | 'LGPLv3'
}
