import { useEditorStore } from '@/stores/editor.store'
import { useRef } from 'react'
import { useActivePlayback } from './useActivePlayback'
import { useMediaElementSync } from './useMediaElementSync'
import { useMediaSource } from './useMediaSource'

export function Player() {
  const isPlaying = useEditorStore((state) => state.isPlaying)
  const { videoPlayback, audioPlayback, videoAsset } = useActivePlayback()
  const visualKind = videoAsset?.kind === 'image' ? 'image' : videoAsset?.kind
  const videoAssetId =
    visualKind === 'video' ? (videoPlayback?.clip.assetId ?? null) : null
  const imageAssetId =
    visualKind === 'image' ? (videoPlayback?.clip.assetId ?? null) : null
  const videoUrl = useMediaSource(videoAssetId)
  const imageUrl = useMediaSource(imageAssetId)
  const audioUrl = useMediaSource(audioPlayback?.clip.assetId ?? null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const showVideo = visualKind === 'video' && Boolean(videoUrl)
  const showImage = visualKind === 'image' && Boolean(imageUrl)

  useMediaElementSync(
    videoRef,
    showVideo ? videoUrl : null,
    videoPlayback?.sourceTime ?? 0,
    isPlaying && showVideo,
  )
  useMediaElementSync(
    audioRef,
    audioUrl,
    audioPlayback?.sourceTime ?? 0,
    isPlaying && Boolean(audioPlayback && audioUrl),
  )

  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={showVideo ? (videoUrl ?? undefined) : undefined}
          className={
            showVideo ? 'max-h-full max-w-full object-contain' : 'hidden'
          }
          preload="auto"
          playsInline
          disablePictureInPicture
        />
        {showImage ? (
          <img
            src={imageUrl ?? undefined}
            alt={videoAsset?.name ?? ''}
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        ) : null}
        {showVideo || showImage ? null : (
          <p className="text-sm text-muted-foreground">
            Nenhum clipe neste instante
          </p>
        )}
      </div>
      <audio ref={audioRef} src={audioUrl ?? undefined} preload="auto" />
    </div>
  )
}
