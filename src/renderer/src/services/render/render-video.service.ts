import { RenderProgress, RenderVideoResult } from '@shared/render'

export function startRenderVideo(): Promise<RenderVideoResult> {
  return window.api.render.start()
}

export function cancelRenderVideo(): Promise<void> {
  return window.api.render.cancel()
}

export function onRenderProgress(
  listener: (progress: RenderProgress) => void,
): () => void {
  return window.api.render.onProgress(listener)
}
