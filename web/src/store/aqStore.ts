import { create } from 'zustand'
import { persist } from 'zustand/middleware'


export interface Task { id: string; courseId?: string; title: string; status: 'Complete'|'In‑Progress'|'Overdue'; due?: string; grade?: number }
export interface Course { id: string; code: string; name: string; units: number; instructor?: string }
export interface Slot { time: string; course: string; room?: string }


interface AQState {
term: string
kpis: { gpa: number; units: number; tasksDonePct: number; level: number; xp: number; nextLevelXp: number; streakDays: number }
scheduleToday: Slot[]
tasks: Task[]
courses: Course[]
setScheduleToday: (s: Slot[]) => void
upsertTask: (t: Task) => void
setTasks: (ts: Task[]) => void
setCourses: (cs: Course[]) => void
setKpis: (k: Partial<AQState['kpis']>) => void
}


export const useAQ = create<AQState>()(
persist(
(set, get) => ({
term: 'SY 2025–2026 • Term 1',
kpis: { gpa: 1.73, units: 21, tasksDonePct: 72, level: 3, xp: 340, nextLevelXp: 500, streakDays: 5 },
scheduleToday: [
{ time: '08:00', course: 'Algorithms', room: 'B402' },
{ time: '11:00', course: 'Data Warehousing', room: 'Lab 2' },
{ time: '15:00', course: 'Operating Systems', room: 'A305' },
],
tasks: [
{ id: 't1', title: 'Discrete HW 3', status: 'In‑Progress' },
{ id: 't2', title: 'OS Lab Report', status: 'Overdue' },
{ id: 't3', title: 'Quiz Prep: Graphs', status: 'Complete' },
],
courses: [],
setScheduleToday: (scheduleToday) => set({ scheduleToday }),
upsertTask: (t) => set({ tasks: (() => { const arr = get().tasks.slice(); const i = arr.findIndex(x=>x.id===t.id); if(i>=0) arr[i]=t; else arr.push(t); return arr })() }),
setTasks: (tasks) => set({ tasks }),
setCourses: (courses) => set({ courses }),
setKpis: (k) => set({ kpis: { ...get().kpis, ...k } }),
}),
{ name: 'aq:data' }
)
)