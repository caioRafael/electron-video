import { RefObject, useEffect, useRef } from 'react'

const SCRUB_JUMP_SECONDS = 0.12

function seekTo(element: HTMLMediaElement, time: number) {
  if (element.readyState < HTMLMediaElement.HAVE_METADATA) {
    return
  }

  if (Math.abs(element.currentTime - time) < 0.03) {
    return
  }

  element.currentTime = time
}

export function useMediaElementSync<T extends HTMLMediaElement>(
  elementRef: RefObject<T | null>,
  src: string | null,
  sourceTime: number,
  isPlaying: boolean,
) {
  const sourceTimeRef = useRef(sourceTime)
  const previousSourceTimeRef = useRef(sourceTime)
  sourceTimeRef.current = sourceTime

  useEffect(() => {
    const element = elementRef.current

    if (!element) {
      return
    }

    function handleLoadedMetadata() {
      const media = elementRef.current

      if (!media) {
        return
      }

      seekTo(media, sourceTimeRef.current)
    }

    element.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      element.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [elementRef, src])

  useEffect(() => {
    const element = elementRef.current

    if (!element || !src) {
      element?.pause()
      return
    }

    seekTo(element, sourceTimeRef.current)

    if (isPlaying) {
      element.play().catch(() => undefined)
      return
    }

    element.pause()
  }, [elementRef, src, isPlaying])

  useEffect(() => {
    const previousSourceTime = previousSourceTimeRef.current
    previousSourceTimeRef.current = sourceTime
    const element = elementRef.current

    if (
      !element ||
      !src ||
      element.readyState < HTMLMediaElement.HAVE_METADATA
    ) {
      return
    }

    if (!isPlaying) {
      seekTo(element, sourceTime)
      return
    }

    const jumped =
      Math.abs(sourceTime - previousSourceTime) > SCRUB_JUMP_SECONDS

    if (jumped) {
      seekTo(element, sourceTime)
    }
  }, [elementRef, src, sourceTime, isPlaying])
}
