import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TBStatus = 'Ordered' | 'Shipped' | 'Received' | 'Returned' | 'Digital'

export type Row = {
  id: string
  classLabel: string
  title: string
  company: string
  status: TBStatus
  purchasedOn?: string
  returnBy?: string
  linkUrl?: string
  filePath?: string
}

type TextbooksState = {
  rows: Row[]
  addRow: () => string
  updateRow: (id: string, patch: Partial<Row>) => void
  removeRow: (id: string) => void
  setRows: (rows: Row[]) => void
}

export const useTextbooks = create<TextbooksState>()(
  persist(
    (set, get) => ({
      rows: Array.from({ length: 9 }).map(() => ({
        id: crypto.randomUUID(),
        classLabel: '',
        title: '',
        company: '',
        status: 'Ordered' as TBStatus,
        purchasedOn: '',
        returnBy: '',
        linkUrl: undefined,
        filePath: undefined,
      })),
      addRow: () => {
        const r: Row = {
          id: crypto.randomUUID(),
          classLabel: '',
          title: '',
          company: '',
          status: 'Ordered',
          purchasedOn: '',
          returnBy: '',
          linkUrl: undefined,
          filePath: undefined,
        }
        set({ rows: [...get().rows, r] })
        return r.id
      },
      updateRow: (id, patch) => set({ rows: get().rows.map(r => r.id === id ? { ...r, ...patch } : r) }),
      removeRow: (id) => set({ rows: get().rows.filter(r => r.id !== id) }),
      setRows: (rows) => set({ rows }),
    }),
    { name: 'aq:textbooks' }
  )
)
