import { create } from 'zustand'

interface SelectedFilesState {
  selectedFiles: any[]
  setSelectedFiles: (files: any[]) => void
}

export const useSelectedFiles = create<SelectedFilesState>((set) => ({
  selectedFiles: [],
  setSelectedFiles: (files) => set({ selectedFiles: files }),
}))
