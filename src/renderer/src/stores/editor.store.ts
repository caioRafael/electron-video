import { create } from 'zustand'

interface EditorStore {
  currentTime: number
  setCurrentTime: (currentTime: number) => void
}

export const useEditorStore = create<EditorStore>()((set) => ({
  currentTime: 0,
  setCurrentTime: (currentTime) => set({ currentTime }),
}))
