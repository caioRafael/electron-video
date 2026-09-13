import { create } from 'zustand'

interface EditorStore {
  currentTime: number
  isPlaying: boolean
  selectedClipId: string | null
  setCurrentTime: (currentTime: number) => void
  play: () => void
  pause: () => void
  togglePlayback: () => void
  setSelectedClipId: (selectedClipId: string | null) => void
}

export const useEditorStore = create<EditorStore>()((set) => ({
  currentTime: 0,
  isPlaying: false,
  selectedClipId: null,
  setCurrentTime: (currentTime) => set({ currentTime }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlayback: () =>
    set((state) => ({
      isPlaying: !state.isPlaying,
    })),
  setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
}))
