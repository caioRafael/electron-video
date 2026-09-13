import { findAssetById, WorkspaceAssets } from '@shared/assets'
import {
  ActiveClipPlayback,
  createEmptyTimeline,
  getActiveClip,
} from '@shared/timeline'
import { useEditorStore } from '@/stores/editor.store'
import { useWorkspaceStore } from '@/stores/workspace.store'

export function useActivePlayback() {
  const currentTime = useEditorStore((state) => state.currentTime)
  const timeline = useWorkspaceStore((state) => state.currentProject?.timeline)
  const assets = useWorkspaceStore((state) => state.assets)
  const resolvedTimeline = timeline ?? createEmptyTimeline()
  const videoTrack = resolvedTimeline.tracks.find((track) => {
    return track.kind === 'video'
  })
  const audioTrack = resolvedTimeline.tracks.find((track) => {
    return track.kind === 'audio'
  })
  const videoPlayback = videoTrack
    ? getActiveClip(videoTrack, currentTime)
    : null
  const audioPlayback = audioTrack
    ? getActiveClip(audioTrack, currentTime)
    : null

  return {
    videoPlayback,
    audioPlayback,
    videoAsset: getPlaybackAsset(assets, videoPlayback),
  }
}

function getPlaybackAsset(
  assets: WorkspaceAssets,
  playback: ActiveClipPlayback | null,
) {
  if (!playback) {
    return undefined
  }

  return findAssetById(assets, playback.clip.assetId)
}
