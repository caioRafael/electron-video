import {
  cancelRenderVideo,
  onRenderProgress,
  startRenderVideo,
} from '@/services/render/render-video.service'
import { RenderProgress } from '@shared/render'
import { useEffect, useState } from 'react'

export type RenderVideoStatus =
  'idle' | 'picking' | 'rendering' | 'completed' | 'failed'

export interface UseRenderVideoResult {
  status: RenderVideoStatus
  progress: RenderProgress | null
  error: string | null
  start: () => void
  cancel: () => void
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return 'Não foi possível renderizar o vídeo'
}

export function useRenderVideo(): UseRenderVideoResult {
  const [status, setStatus] = useState<RenderVideoStatus>('idle')
  const [progress, setProgress] = useState<RenderProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return onRenderProgress((nextProgress) => {
      setProgress(nextProgress)
      setStatus((current) => {
        if (current === 'picking' || current === 'rendering') {
          return 'rendering'
        }

        return current
      })
    })
  }, [])

  function start() {
    setError(null)
    setProgress(null)
    setStatus('picking')

    startRenderVideo()
      .then((result) => {
        if (result.canceled) {
          setStatus('idle')
          setProgress(null)
          return
        }

        setStatus('completed')
      })
      .catch((caughtError: unknown) => {
        setStatus('failed')
        setError(getErrorMessage(caughtError))
      })
  }

  function cancel() {
    cancelRenderVideo().catch(() => undefined)
  }

  return {
    status,
    progress,
    error,
    start,
    cancel,
  }
}
