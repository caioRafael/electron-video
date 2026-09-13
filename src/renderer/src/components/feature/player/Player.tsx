import { findAssetById } from '@shared/assets'
import { usePlayback } from '@/components/feature/editor'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { CircleNotchIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { getPlayerViewStatus, shouldMuteVideo } from './player.utils'
import { useMediaElementSync } from './useMediaElementSync'
import { useMediaSource } from './useMediaSource'

export function Player() {
  const { isPlaying, activeVideoClip, activeAudioClip } = usePlayback()
  const assets = useWorkspaceStore((state) => state.assets)
  const videoAsset = activeVideoClip
    ? findAssetById(assets, activeVideoClip.clip.assetId)
    : undefined
  const visualKind = videoAsset?.kind === 'image' ? 'image' : videoAsset?.kind
  const videoAssetId =
    visualKind === 'video' ? (activeVideoClip?.clip.assetId ?? null) : null
  const imageAssetId =
    visualKind === 'image' ? (activeVideoClip?.clip.assetId ?? null) : null
  const videoSource = useMediaSource(videoAssetId)
  const imageSource = useMediaSource(imageAssetId)
  const audioSource = useMediaSource(activeAudioClip?.clip.assetId ?? null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [hasVisualMediaError, setHasVisualMediaError] = useState(false)
  const [hasAudioMediaError, setHasAudioMediaError] = useState(false)
  const [isVisualReady, setIsVisualReady] = useState(false)
  const videoUrl = videoSource.status === 'ready' ? videoSource.url : null
  const imageUrl = imageSource.status === 'ready' ? imageSource.url : null
  const audioUrl = audioSource.status === 'ready' ? audioSource.url : null
  const showVideo = visualKind === 'video' && Boolean(videoUrl)
  const showImage = visualKind === 'image' && Boolean(imageUrl)
  const viewStatus = getPlayerViewStatus({
    hasVisualClip: Boolean(activeVideoClip),
    hasAudioClip: Boolean(activeAudioClip),
    isVisualLoading:
      videoSource.status === 'loading' || imageSource.status === 'loading',
    isAudioLoading: audioSource.status === 'loading',
    hasVisualError:
      videoSource.status === 'error' ||
      imageSource.status === 'error' ||
      hasVisualMediaError,
    hasAudioError: audioSource.status === 'error' || hasAudioMediaError,
    isVisualReady: isVisualReady && (showVideo || showImage),
  })

  useMediaElementSync(
    videoRef,
    showVideo ? videoUrl : null,
    activeVideoClip?.sourceTime ?? 0,
    isPlaying && showVideo,
  )
  useMediaElementSync(
    audioRef,
    audioUrl,
    activeAudioClip?.sourceTime ?? 0,
    isPlaying && Boolean(activeAudioClip && audioUrl),
  )

  useEffect(() => {
    setIsVisualReady(false)
    setHasVisualMediaError(false)
  }, [videoUrl, imageUrl])

  useEffect(() => {
    setHasAudioMediaError(false)
  }, [audioUrl])

  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={showVideo ? (videoUrl ?? undefined) : undefined}
          muted={shouldMuteVideo(Boolean(activeAudioClip))}
          className={
            showVideo ? 'max-h-full max-w-full object-contain' : 'hidden'
          }
          preload="auto"
          playsInline
          disablePictureInPicture
          onLoadedData={() => {
            setIsVisualReady(true)
            setHasVisualMediaError(false)
          }}
          onError={() => {
            setIsVisualReady(false)
            setHasVisualMediaError(true)
          }}
        />
        {showImage ? (
          <img
            src={imageUrl ?? undefined}
            alt={videoAsset?.name ?? ''}
            className="max-h-full max-w-full object-contain"
            draggable={false}
            onLoad={() => {
              setIsVisualReady(true)
              setHasVisualMediaError(false)
            }}
            onError={() => {
              setIsVisualReady(false)
              setHasVisualMediaError(true)
            }}
          />
        ) : null}
        <audio
          ref={audioRef}
          src={audioUrl ?? undefined}
          preload="auto"
          onLoadedData={() => {
            setHasAudioMediaError(false)
          }}
          onError={() => {
            setHasAudioMediaError(true)
          }}
        />
        {viewStatus === 'loading' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <CircleNotchIcon
              className="size-6 animate-spin text-muted-foreground"
              aria-label="Carregando mídia"
            />
          </div>
        ) : null}
        {viewStatus === 'error' ? (
          <p className="absolute text-sm text-destructive">
            Não foi possível carregar este asset.
          </p>
        ) : null}
        {viewStatus === 'empty' ? (
          <p className="text-sm text-muted-foreground">
            Nenhum clipe neste instante
          </p>
        ) : null}
      </div>
    </div>
  )
}
