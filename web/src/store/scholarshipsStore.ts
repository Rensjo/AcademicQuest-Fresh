import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Status = 'Received' | 'Applied' | 'In-Progress' | 'Rejected' | 'Not Started'

export type Row = {
  id: string
  status: Status
  name: string
  location: string
  dueDate?: string
  submittedDate?: string
  resume: boolean
  essay: boolean
  otherDocs: boolean
  resumePath?: string
  essayPath?: string
  otherDocsPaths?: string[]
  amountAwarded?: number
}

function createRow(): Row {
  return {
    id: crypto.randomUUID(),
    status: 'Not Started',
    name: '',
    location: '',
    dueDate: '',
    submittedDate: '',
    resume: false,
    essay: false,
    otherDocs: false,
    otherDocsPaths: [],
    amountAwarded: undefined,
  }
}

type ScholarshipsState = {
  rows: Row[]
  addRow: () => string
  updateRow: (id: string, patch: Partial<Row>) => void
  removeRow: (id: string) => void
  setRows: (rows: Row[]) => void
}

export const useScholarships = create<ScholarshipsState>()(
  persist(
    (set, get) => ({
  rows: Array.from({ length: 9 }, () => createRow()),
      addRow: () => {
        const r = createRow()
        set({ rows: [...get().rows, r] })
        return r.id
      },
      updateRow: (id, patch) => set({ rows: get().rows.map(r => r.id === id ? { ...r, ...patch } : r) }),
      removeRow: (id) => set({ rows: get().rows.filter(r => r.id !== id) }),
      setRows: (rows) => set({ rows }),
    }),
    { name: 'aq:scholarships' }
  )
)
