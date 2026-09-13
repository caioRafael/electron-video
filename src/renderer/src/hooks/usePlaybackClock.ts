import {
  createEmptyTimeline,
  getBoundedPlaybackState,
  getTimelineContentDuration,
} from '@shared/timeline'
import { useEditorStore } from '@/stores/editor.store'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useEffect } from 'react'

export function usePlaybackClock() {
  const isPlaying = useEditorStore((state) => state.isPlaying)
  const currentTime = useEditorStore((state) => state.currentTime)
  const pause = useEditorStore((state) => state.pause)
  const setCurrentTime = useEditorStore((state) => state.setCurrentTime)
  const timeline = useWorkspaceStore((state) => state.currentProject?.timeline)

  useEffect(() => {
    const duration = getTimelineContentDuration(
      timeline ?? createEmptyTimeline(),
    )
    const next = getBoundedPlaybackState(currentTime, duration, isPlaying)

    if (isPlaying && !next.isPlaying) {
      pause()
    }

    if (next.currentTime !== currentTime) {
      setCurrentTime(next.currentTime)
    }
  }, [currentTime, isPlaying, pause, setCurrentTime, timeline])

  useEffect(() => {
    if (!isPlaying) {
      return
    }

    let startTime = useEditorStore.getState().currentTime
    let startTimestamp = performance.now()
    let applyingClock = false
    let frameId = 0

    function getContentDuration() {
      const currentTimeline =
        useWorkspaceStore.getState().currentProject?.timeline ??
        createEmptyTimeline()

      return getTimelineContentDuration(currentTimeline)
    }

    const initialDuration = getContentDuration()

    if (initialDuration <= 0) {
      pause()
      return
    }

    if (startTime >= initialDuration) {
      startTime = 0
      setCurrentTime(0)
    }

    const unsubscribe = useEditorStore.subscribe((state, previous) => {
      if (applyingClock || state.currentTime === previous.currentTime) {
        return
      }

      startTime = state.currentTime
      startTimestamp = performance.now()
    })

    function tick(now: number) {
      const duration = getContentDuration()
      const elapsed = (now - startTimestamp) / 1000
      const nextTime = startTime + elapsed

      if (duration <= 0 || nextTime >= duration) {
        applyingClock = true
        setCurrentTime(Math.max(0, duration))
        applyingClock = false
        pause()
        return
      }

      applyingClock = true
      setCurrentTime(nextTime)
      applyingClock = false
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frameId)
      unsubscribe()
    }
  }, [isPlaying, pause, setCurrentTime])
}
