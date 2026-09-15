export type RenderPhase =
  | 'loading'
  | 'planning'
  | 'preparing'
  | 'rendering'
  | 'finalizing'
  | 'completed'
  | 'cancelled'
  | 'failed'

export interface RenderProgress {
  phase: RenderPhase
  progress: number
  elapsedMs: number
  durationMs?: number
  fps?: number
  speed?: number
  message?: string
}

export interface RenderVideoCanceled {
  canceled: true
}

export interface RenderVideoCompleted {
  canceled: false
  outputPath: string
  duration: number
}

export type RenderVideoResult = RenderVideoCanceled | RenderVideoCompleted
