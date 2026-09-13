export function shouldMuteVideo(hasActiveAudioClip: boolean): boolean {
  return hasActiveAudioClip
}

export type PlayerViewStatus = 'empty' | 'loading' | 'error' | 'ready'

export function getPlayerViewStatus(input: {
  hasVisualClip: boolean
  hasAudioClip: boolean
  isVisualLoading: boolean
  isAudioLoading: boolean
  hasVisualError: boolean
  hasAudioError: boolean
  isVisualReady: boolean
}): PlayerViewStatus {
  if (input.hasVisualError || (input.hasAudioError && !input.hasVisualClip)) {
    return 'error'
  }

  if (
    input.isVisualLoading ||
    (input.isAudioLoading && !input.hasVisualClip && !input.isVisualReady)
  ) {
    return 'loading'
  }

  if (input.isVisualReady) {
    return 'ready'
  }

  if (input.hasVisualClip || input.hasAudioClip) {
    return 'loading'
  }

  return 'empty'
}
