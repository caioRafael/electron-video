import { getMediaSource } from '@/services/media/get-source.service'
import { useEffect, useState } from 'react'

export function useMediaSource(assetId: string | null) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!assetId) {
      setUrl(null)
      return
    }

    const currentAssetId = assetId
    let cancelled = false

    async function loadSource() {
      try {
        const source = await getMediaSource(currentAssetId)

        if (!cancelled) {
          setUrl(source.url)
        }
      } catch {
        if (!cancelled) {
          setUrl(null)
        }
      }
    }

    loadSource()

    return () => {
      cancelled = true
    }
  }, [assetId])

  return url
}
