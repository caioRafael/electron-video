import {
  ActiveClipPlayback,
  createEmptyTimeline,
  getPlaybackClip,
  getTimelineContentDuration,
} from '@shared/timeline'
import { usePlaybackClock } from '@/hooks/usePlaybackClock'
import { useEditorStore } from '@/stores/editor.store'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { createContext, ReactNode, useContext, useEffect, useMemo } from 'react'

export interface PlaybackActions {
  play: () => void
  pause: () => void
  togglePlay: () => void
  setCurrentTime: (time: number) => void
}

export interface PlaybackState {
  currentTime: number
  isPlaying: boolean
  duration: number
  activeVideoClip: ActiveClipPlayback | null
  activeAudioClip: ActiveClipPlayback | null
}

export interface PlaybackContextValue extends PlaybackState, PlaybackActions {}

const PlaybackStateContext = createContext<PlaybackState | null>(null)
const PlaybackActionsContext = createContext<PlaybackActions | null>(null)

interface PlaybackProviderProps {
  children: ReactNode
}

export function PlaybackProvider({ children }: PlaybackProviderProps) {
  usePlaybackClock()

  const currentTime = useEditorStore((state) => state.currentTime)
  const isPlaying = useEditorStore((state) => state.isPlaying)
  const play = useEditorStore((state) => state.play)
  const pause = useEditorStore((state) => state.pause)
  const togglePlay = useEditorStore((state) => state.togglePlayback)
  const setCurrentTime = useEditorStore((state) => state.setCurrentTime)
  const timeline = useWorkspaceStore((state) => state.currentProject?.timeline)
  const resolvedTimeline = timeline ?? createEmptyTimeline()
  const videoTrack = resolvedTimeline.tracks.find((track) => {
    return track.kind === 'video'
  })
  const audioTrack = resolvedTimeline.tracks.find((track) => {
    return track.kind === 'audio'
  })

  const actions = useMemo<PlaybackActions>(() => {
    return {
      play,
      pause,
      togglePlay,
      setCurrentTime,
    }
  }, [play, pause, togglePlay, setCurrentTime])

  const state: PlaybackState = {
    currentTime,
    isPlaying,
    duration: getTimelineContentDuration(resolvedTimeline),
    activeVideoClip: videoTrack
      ? getPlaybackClip(videoTrack, currentTime)
      : null,
    activeAudioClip: audioTrack
      ? getPlaybackClip(audioTrack, currentTime)
      : null,
  }

  return (
    <PlaybackActionsContext.Provider value={actions}>
      <PlaybackStateContext.Provider value={state}>
        <PlaybackHotkeys />
        {children}
      </PlaybackStateContext.Provider>
    </PlaybackActionsContext.Provider>
  )
}

export function usePlayback(): PlaybackContextValue {
  const state = useContext(PlaybackStateContext)
  const actions = useContext(PlaybackActionsContext)

  if (!state || !actions) {
    throw new Error('usePlayback must be used within PlaybackProvider')
  }

  return {
    ...state,
    ...actions,
  }
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true
  }

  return target.isContentEditable
}

function PlaybackHotkeys() {
  const { togglePlay } = usePlayback()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== 'Space' && event.key !== ' ') {
        return
      }

      if (event.repeat || isEditableTarget(event.target)) {
        return
      }

      event.preventDefault()
      togglePlay()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [togglePlay])

  return null
}

export function usePlaybackActions(): PlaybackActions {
  const actions = useContext(PlaybackActionsContext)

  if (!actions) {
    throw new Error('usePlaybackActions must be used within PlaybackProvider')
  }

  return actions
}
