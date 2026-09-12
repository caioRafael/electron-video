import { create } from 'zustand'

interface EditorStore {
  currentTime: number
  selectedClipId: string | null
  setCurrentTime: (currentTime: number) => void
  setSelectedClipId: (selectedClipId: string | null) => void
}

export const useEditorStore = create<EditorStore>()((set) => ({
  currentTime: 0,
  selectedClipId: null,
  setCurrentTime: (currentTime) => set({ currentTime }),
  setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
}))
