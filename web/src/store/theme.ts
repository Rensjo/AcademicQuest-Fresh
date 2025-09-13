import { create } from 'zustand'
import { persist } from 'zustand/middleware'


export type Palette = 'sky' | 'violet' | 'emerald'
export type Mode = 'light' | 'dark' | 'system'


export const PALETTES: Record<Palette, string[]> = {
    sky: ['#0ea5e9', '#22c55e', '#f59e0b', '#a78bfa', '#ef4444'],
    violet: ['#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ef4444'],
    emerald: ['#10b981', '#60a5fa', '#f59e0b', '#a78bfa', '#ef4444'],
}

interface ThemeState {
    palette: Palette
    accent: number // 0–100
    compact: boolean
    font: string
    mode: Mode
    radius: number // 8–24
    textScale: number // 0.9–1.1
    setPalette: (p: Palette) => void
    setAccent: (n: number) => void
    setCompact: (b: boolean) => void
    setFont: (f: string) => void
    setMode: (m: Mode) => void
    setRadius: (r: number) => void
    setTextScale: (t: number) => void
}


export const useTheme = create<ThemeState>()(
    persist(
        (set) => ({
            palette: 'sky',
            accent: 60,
            compact: false,
            font: 'Inter',
            mode: 'light',
            radius: 16,
            textScale: 1,
            setPalette: (palette) => set({ palette }),
            setAccent: (accent) => set({ accent }),
            setCompact: (compact) => set({ compact }),
            setFont: (font) => set({ font }),
            setMode: (mode) => set({ mode }),
            setRadius: (radius) => set({ radius }),
            setTextScale: (textScale) => set({ textScale }),
        }),
        { name: 'aq:theme' }
    )
)