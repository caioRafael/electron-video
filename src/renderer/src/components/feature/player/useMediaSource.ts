import { getMediaSource } from '@/services/media/get-source.service'
import { useEffect, useState } from 'react'

export type MediaSourceStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface ResolvedMediaSource {
  status: MediaSourceStatus
  url: string | null
}

const IDLE_SOURCE: ResolvedMediaSource = {
  status: 'idle',
  url: null,
}

export function useMediaSource(assetId: string | null): ResolvedMediaSource {
  const [source, setSource] = useState<ResolvedMediaSource>(IDLE_SOURCE)

  useEffect(() => {
    if (!assetId) {
      setSource(IDLE_SOURCE)
      return
    }

    const currentAssetId = assetId
    let cancelled = false

    setSource({
      status: 'loading',
      url: null,
    })

    async function loadSource() {
      try {
        const media = await getMediaSource(currentAssetId)

        if (!cancelled) {
          setSource({
            status: 'ready',
            url: media.url,
          })
        }
      } catch {
        if (!cancelled) {
          setSource({
            status: 'error',
            url: null,
          })
        }
      }
    }

    loadSource()

    return () => {
      cancelled = true
    }
  }, [assetId])

  return source
}
