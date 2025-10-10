import { create } from 'zustand'

export type FiltersState = {
  department: string | null
  country: string | null
  state: string | null
  setDepartment: (v: string | null) => void
  setCountry: (v: string | null) => void
  setState: (v: string | null) => void
  reset: () => void
}

export const useFilters = create<FiltersState>((set) => ({
  department: null,
  country: null,
  state: null,
  setDepartment: (v) => set({ department: v }),
  setCountry: (v) => set({ country: v, state: null }),
  setState: (v) => set({ state: v }),
  reset: () => set({ department: null, country: null, state: null })
}))
