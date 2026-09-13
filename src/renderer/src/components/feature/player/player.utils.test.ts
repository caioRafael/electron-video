import { describe, expect, it } from 'vitest'
import { getPlayerViewStatus, shouldMuteVideo } from './player.utils'

describe('shouldMuteVideo', () => {
  it('mutes the video when a timeline audio clip is active', () => {
    expect(shouldMuteVideo(true)).toBe(true)
    expect(shouldMuteVideo(false)).toBe(false)
  })
})

describe('getPlayerViewStatus', () => {
  it('shows an empty state when nothing is active', () => {
    expect(
      getPlayerViewStatus({
        hasVisualClip: false,
        hasAudioClip: false,
        isVisualLoading: false,
        isAudioLoading: false,
        hasVisualError: false,
        hasAudioError: false,
        isVisualReady: false,
      }),
    ).toBe('empty')
  })

  it('shows loading while a visual source is resolving', () => {
    expect(
      getPlayerViewStatus({
        hasVisualClip: true,
        hasAudioClip: false,
        isVisualLoading: true,
        isAudioLoading: false,
        hasVisualError: false,
        hasAudioError: false,
        isVisualReady: false,
      }),
    ).toBe('loading')
  })

  it('shows an explicit error when the source fails', () => {
    expect(
      getPlayerViewStatus({
        hasVisualClip: true,
        hasAudioClip: false,
        isVisualLoading: false,
        isAudioLoading: false,
        hasVisualError: true,
        hasAudioError: false,
        isVisualReady: false,
      }),
    ).toBe('error')
  })
})
