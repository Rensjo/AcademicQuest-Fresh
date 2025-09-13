import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ClassAttendance {
  date: string // YYYY-MM-DD
  slotId: string
  courseCode: string
  courseName: string
  attended: boolean
  marked: boolean // whether user has marked attendance for this day
  time: string
  room?: string
}

export interface AttendanceRecord {
  date: string // YYYY-MM-DD
  classes: ClassAttendance[]
  totalClasses: number
  attendedClasses: number
  attendanceRate: number // percentage
}

interface AttendanceState {
  records: AttendanceRecord[]
  addAttendanceRecord: (date: string, classes: ClassAttendance[]) => void
  markAttendance: (date: string, slotId: string, attended: boolean) => void
  getAttendanceForDate: (date: string) => AttendanceRecord | undefined
  getAttendanceStreak: () => number
  getLast365DaysData: () => { date: string; attendanceRate: number; totalClasses: number }[]
  getWeeklyAttendanceRate: () => number
  getMonthlyAttendanceRate: () => number
  getSemesterAttendanceRate: () => number
  getPerfectAttendanceDays: () => number
  getTotalAttendanceDays: () => number
  hasUnmarkedClasses: (date: string) => boolean
  getTodaysPendingClasses: () => ClassAttendance[]
}

// Helper function to calculate attendance rate
const calculateAttendanceRate = (classes: ClassAttendance[]): number => {
  const markedClasses = classes.filter(c => c.marked)
  if (markedClasses.length === 0) return 0
  const attendedCount = markedClasses.filter(c => c.attended).length
  return Math.round((attendedCount / markedClasses.length) * 100)
}

export const useAttendance = create<AttendanceState>()(
  persist(
    (set, get) => ({
      records: [],

      addAttendanceRecord: (date, classes) => {
        set((state) => {
          const existingIndex = state.records.findIndex(r => r.date === date)
          const attendanceRate = calculateAttendanceRate(classes)
          const newRecord: AttendanceRecord = {
            date,
            classes,
            totalClasses: classes.length,
            attendedClasses: classes.filter(c => c.attended && c.marked).length,
            attendanceRate
          }

          if (existingIndex >= 0) {
            // Update existing record
            const updatedRecords = [...state.records]
            updatedRecords[existingIndex] = newRecord
            return { records: updatedRecords }
          } else {
            // Add new record
            return { records: [...state.records, newRecord].sort((a, b) => a.date.localeCompare(b.date)) }
          }
        })
      },

      markAttendance: (date, slotId, attended) => {
        set((state) => {
          const recordIndex = state.records.findIndex(r => r.date === date)
          if (recordIndex === -1) return state

          const updatedRecords = [...state.records]
          const record = { ...updatedRecords[recordIndex] }
          const classIndex = record.classes.findIndex(c => c.slotId === slotId)
          
          if (classIndex === -1) return state

          // Update the class attendance
          const updatedClasses = [...record.classes]
          updatedClasses[classIndex] = {
            ...updatedClasses[classIndex],
            attended,
            marked: true
          }

          // Recalculate metrics
          record.classes = updatedClasses
          record.attendedClasses = updatedClasses.filter(c => c.attended && c.marked).length
          record.attendanceRate = calculateAttendanceRate(updatedClasses)

          updatedRecords[recordIndex] = record
          return { records: updatedRecords }
        })
      },

      getAttendanceForDate: (date) => {
        return get().records.find(r => r.date === date)
      },

      getAttendanceStreak: () => {
        const { records } = get()
        if (records.length === 0) return 0

        // Sort records by date (most recent first)
        const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date))
        
        let streak = 0
        for (const record of sortedRecords) {
          // Only count days with classes
          if (record.totalClasses > 0) {
            if (record.attendanceRate === 100) {
              streak++
            } else {
              break
            }
          }
        }
        return streak
      },

      getLast365DaysData: () => {
        const { records } = get()
        const now = new Date()
        const oneYearAgo = new Date(now)
        oneYearAgo.setDate(oneYearAgo.getDate() - 364) // 365 days total

        // Generate array of last 365 days
        const last365Days = []
        for (let i = 364; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          const dateString = date.toISOString().split('T')[0]
          
          const record = records.find(r => r.date === dateString)
          last365Days.push({
            date: dateString,
            attendanceRate: record?.attendanceRate || 0,
            totalClasses: record?.totalClasses || 0
          })
        }

        return last365Days
      },

      getWeeklyAttendanceRate: () => {
        const { records } = get()
        const now = new Date()
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)

        const weekRecords = records.filter(r => {
          const recordDate = new Date(r.date)
          return recordDate >= weekAgo && recordDate <= now && r.totalClasses > 0
        })

        if (weekRecords.length === 0) return 0

        const totalClasses = weekRecords.reduce((sum, r) => sum + r.totalClasses, 0)
        const attendedClasses = weekRecords.reduce((sum, r) => sum + r.attendedClasses, 0)

        return totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0
      },

      getMonthlyAttendanceRate: () => {
        const { records } = get()
        const now = new Date()
        const monthAgo = new Date(now)
        monthAgo.setDate(monthAgo.getDate() - 30)

        const monthRecords = records.filter(r => {
          const recordDate = new Date(r.date)
          return recordDate >= monthAgo && recordDate <= now && r.totalClasses > 0
        })

        if (monthRecords.length === 0) return 0

        const totalClasses = monthRecords.reduce((sum, r) => sum + r.totalClasses, 0)
        const attendedClasses = monthRecords.reduce((sum, r) => sum + r.attendedClasses, 0)

        return totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0
      },

      getSemesterAttendanceRate: () => {
        const { records } = get()
        const now = new Date()
        const semesterAgo = new Date(now)
        semesterAgo.setDate(semesterAgo.getDate() - 120) // ~4 months

        const semesterRecords = records.filter(r => {
          const recordDate = new Date(r.date)
          return recordDate >= semesterAgo && recordDate <= now && r.totalClasses > 0
        })

        if (semesterRecords.length === 0) return 0

        const totalClasses = semesterRecords.reduce((sum, r) => sum + r.totalClasses, 0)
        const attendedClasses = semesterRecords.reduce((sum, r) => sum + r.attendedClasses, 0)

        return totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0
      },

      getPerfectAttendanceDays: () => {
        const { records } = get()
        return records.filter(r => r.totalClasses > 0 && r.attendanceRate === 100).length
      },

      getTotalAttendanceDays: () => {
        const { records } = get()
        return records.filter(r => r.totalClasses > 0).length
      },

      hasUnmarkedClasses: (date) => {
        const record = get().getAttendanceForDate(date)
        if (!record) return false
        return record.classes.some(c => !c.marked)
      },

      getTodaysPendingClasses: () => {
        const today = new Date().toISOString().split('T')[0]
        const record = get().getAttendanceForDate(today)
        if (!record) return []
        return record.classes.filter(c => !c.marked)
      }
    }),
    {
      name: 'aq:attendance'
    }
  )
)
