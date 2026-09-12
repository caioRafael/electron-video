import { removeClipFromCurrentTimeline } from '@/services/workspace/session'
import { useEditorStore } from '@/stores/editor.store'
import { useEffect } from 'react'

export function useTimelineHotkeys() {
  const selectedClipId = useEditorStore((state) => state.selectedClipId)
  const setSelectedClipId = useEditorStore((state) => state.setSelectedClipId)

  useEffect(() => {
    async function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return
      }

      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (!selectedClipId) {
        return
      }

      event.preventDefault()
      await removeClipFromCurrentTimeline(selectedClipId)
      setSelectedClipId(null)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedClipId, setSelectedClipId])
}
