import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { notificationService } from '@/services/notificationService'

export type BadgeType = 
  | 'first_task' | 'task_streak' | 'early_bird' | 'perfect_week' | 'study_warrior'
  | 'schedule_master' | 'academic_scholar' | 'time_keeper' | 'goal_crusher'
  | 'consistency_king' | 'semester_starter' | 'perfect_attendance' | 'attendance_streak'
  | 'first_class' | 'class_warrior' | 'attendance_champion' | 'never_miss' | 'semester_perfect'
  | 'monthly_perfect' | 'attendance_legend' | 'class_dedication'
  | 'gpa_achiever' | 'academic_foundation' | 'course_planner' | 'schedule_architect'
  | 'semester_organizer' | 'academic_starter' | 'grade_warrior' | 'dean_list'

export interface Badge {
  id: BadgeType
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlocked: boolean
  unlockedAt?: string
  progress?: number
  maxProgress?: number
}

export interface DailyQuest {
  id: string
  title: string
  description: string
  type: 'task' | 'study' | 'schedule' | 'academic'
  target: number
  progress: number
  completed: boolean
  xpReward: number
  date: string
}

export interface UserStats {
  level: number
  xp: number
  nextLevelXp: number
  totalXp: number
  streakDays: number
  longestStreak: number
  tasksCompleted: number
  tasksCompletedEarly: number
  studyHours: number
  scheduleBlocksCompleted: number
  perfectWeeks: number
  classesAttended: number
  attendanceStreak: number
  longestAttendanceStreak: number
  badges: Badge[]
  dailyQuests: DailyQuest[]
  lastActiveDate: string
  // Streak freeze system
  streakFreezeActive: boolean
  streakFreezeStartDate: string | null
  streakFreezeEndDate: string | null
  streakFreezeReason: string | null
  frozenStreakDays: number
  attendanceStreakFreezeActive: boolean
  frozenAttendanceStreak: number
}

interface GamificationState {
  stats: UserStats
  updateStats: (updates: Partial<UserStats>) => void
  addXP: (amount: number) => void
  unlockBadge: (badgeId: BadgeType) => void
  completeQuest: (questId: string) => void
  updateQuestProgress: (type: 'task' | 'study' | 'schedule' | 'academic', amount?: number) => void
  generateDailyQuests: () => void
  checkAchievements: () => void
  resetStreak: () => void
  incrementStreak: () => void
  // Streak freeze methods
  activateStreakFreeze: (reason: string, startDate?: string, endDate?: string) => void
  deactivateStreakFreeze: () => void
  activateAttendanceStreakFreeze: () => void
  deactivateAttendanceStreakFreeze: () => void
  isStreakFrozen: () => boolean
  isAttendanceStreakFrozen: () => boolean
  getEffectiveStreak: () => number
  getEffectiveAttendanceStreak: () => number
}

const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_task',
    name: 'Getting Started',
    description: 'Complete your first task',
    icon: '🎯',
    rarity: 'common',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'task_streak',
    name: 'Task Master',
    description: 'Complete 10 tasks in a row',
    icon: '⚡',
    rarity: 'rare',
    unlocked: false,
    maxProgress: 10,
    progress: 0
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 5 tasks before their due date',
    icon: '🌅',
    rarity: 'common',
    unlocked: false,
    maxProgress: 5,
    progress: 0
  },
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Complete all scheduled blocks for a week',
    icon: '✨',
    rarity: 'epic',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'study_warrior',
    name: 'Study Warrior',
    description: 'Study for 25+ hours in a week',
    icon: '⚔️',
    rarity: 'rare',
    unlocked: false,
    maxProgress: 25,
    progress: 0
  },
  {
    id: 'schedule_master',
    name: 'Schedule Master',
    description: 'Complete 50 scheduled blocks',
    icon: '📅',
    rarity: 'rare',
    unlocked: false,
    maxProgress: 50,
    progress: 0
  },
  {
    id: 'academic_scholar',
    name: 'Academic Scholar',
    description: 'Maintain 3.5+ GPA for a semester',
    icon: '🎓',
    rarity: 'legendary',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'time_keeper',
    name: 'Time Keeper',
    description: 'Log 100 study sessions',
    icon: '⏰',
    rarity: 'epic',
    unlocked: false,
    maxProgress: 100,
    progress: 0
  },
  {
    id: 'goal_crusher',
    name: 'Goal Crusher',
    description: 'Complete 100 tasks total',
    icon: '🏆',
    rarity: 'epic',
    unlocked: false,
    maxProgress: 100,
    progress: 0
  },
  {
    id: 'consistency_king',
    name: 'Consistency King',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    rarity: 'legendary',
    unlocked: false,
    maxProgress: 30,
    progress: 0
  },
  {
    id: 'semester_starter',
    name: 'Semester Starter',
    description: 'Set up your first course and schedule',
    icon: '🚀',
    rarity: 'common',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'perfect_attendance',
    name: 'Perfect Attendance',
    description: 'Attend all classes for 30 days straight',
    icon: '🎯',
    rarity: 'legendary',
    unlocked: false,
    maxProgress: 30,
    progress: 0
  },
  {
    id: 'attendance_streak',
    name: 'Class Commitment',
    description: 'Maintain a 7-day attendance streak',
    icon: '📚',
    rarity: 'rare',
    unlocked: false,
    maxProgress: 7,
    progress: 0
  },
  {
    id: 'first_class',
    name: 'First Day',
    description: 'Attend your first class',
    icon: '🎒',
    rarity: 'common',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'class_warrior',
    name: 'Class Warrior',
    description: 'Attend 50 classes',
    icon: '⚔️',
    rarity: 'rare',
    unlocked: false,
    maxProgress: 50,
    progress: 0
  },
  {
    id: 'attendance_champion',
    name: 'Attendance Champion',
    description: 'Maintain 95%+ attendance for 30 days',
    icon: '🏆',
    rarity: 'epic',
    unlocked: false,
    maxProgress: 30,
    progress: 0
  },
  {
    id: 'never_miss',
    name: 'Never Miss',
    description: 'Attend 100 classes without missing any',
    icon: '💎',
    rarity: 'legendary',
    unlocked: false,
    maxProgress: 100,
    progress: 0
  },
  {
    id: 'semester_perfect',
    name: 'Semester Perfect',
    description: 'Perfect attendance for an entire semester (120 days)',
    icon: '👑',
    rarity: 'legendary',
    unlocked: false,
    maxProgress: 120,
    progress: 0
  },
  {
    id: 'monthly_perfect',
    name: 'Monthly Perfect',
    description: 'Perfect attendance for 30 consecutive days',
    icon: '🌟',
    rarity: 'epic',
    unlocked: false,
    maxProgress: 30,
    progress: 0
  },
  {
    id: 'attendance_legend',
    name: 'Attendance Legend',
    description: 'Maintain 90%+ attendance for a full year',
    icon: '🔥',
    rarity: 'legendary',
    unlocked: false,
    maxProgress: 365,
    progress: 0
  },
  {
    id: 'class_dedication',
    name: 'Class Dedication',
    description: 'Attend classes for 200 days total',
    icon: '📖',
    rarity: 'epic',
    unlocked: false,
    maxProgress: 200,
    progress: 0
  },
  {
    id: 'gpa_achiever',
    name: 'GPA Achiever',
    description: 'Achieve a 3.0 GPA or higher',
    icon: '📊',
    rarity: 'rare',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'academic_foundation',
    name: 'Academic Foundation',
    description: 'Maintain a 3.5+ GPA for 30 days',
    icon: '🏛️',
    rarity: 'epic',
    unlocked: false,
    maxProgress: 30,
    progress: 0
  },
  {
    id: 'course_planner',
    name: 'Course Planner',
    description: 'Add your first course to the course planner',
    icon: '📋',
    rarity: 'common',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'schedule_architect',
    name: 'Schedule Architect',
    description: 'Set up a complete weekly schedule with all courses',
    icon: '🏗️',
    rarity: 'rare',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'semester_organizer',
    name: 'Semester Organizer',
    description: 'Plan courses for an entire semester (5+ courses)',
    icon: '🗂️',
    rarity: 'epic',
    unlocked: false,
    maxProgress: 5,
    progress: 0
  },
  {
    id: 'academic_starter',
    name: 'Academic Starter',
    description: 'Set up both course planner and schedule for the first time',
    icon: '🎯',
    rarity: 'rare',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'grade_warrior',
    name: 'Grade Warrior',
    description: 'Track grades for 10+ assignments',
    icon: '⚔️',
    rarity: 'rare',
    unlocked: false,
    maxProgress: 10,
    progress: 0
  },
  {
    id: 'dean_list',
    name: 'Dean\'s List',
    description: 'Achieve a 3.8+ GPA for a full semester',
    icon: '🎖️',
    rarity: 'legendary',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  }
]

export const XP_PER_LEVEL = 500
const calculateLevelFromXP = (xp: number): number => Math.floor(xp / XP_PER_LEVEL) + 1
const calculateNextLevelXP = (level: number): number => level * XP_PER_LEVEL

const QUEST_TEMPLATES = [
  { type: 'task', title: 'Task Champion', description: 'Complete 3 tasks today', target: 3, xp: 50 },
  { type: 'task', title: 'Early Achiever', description: 'Complete 1 task before its due date', target: 1, xp: 75 },
  { type: 'study', title: 'Study Session', description: 'Study for 2 hours today', target: 2, xp: 60 },
  { type: 'study', title: 'Focus Time', description: 'Complete 4 Pomodoro sessions', target: 4, xp: 40 },
  { type: 'schedule', title: 'Schedule Keeper', description: 'Complete 3 scheduled blocks today', target: 3, xp: 55 },
  { type: 'academic', title: 'Course Explorer', description: 'Review 1 course material', target: 1, xp: 35 }
]

// Migration function to add new badges to existing users
const migrateBadges = (existingBadges: Badge[]): Badge[] => {
  const existingIds = new Set(existingBadges.map(b => b.id))
  const newBadges = INITIAL_BADGES.filter(b => !existingIds.has(b.id))
  
  // Update existing badges with any new properties while preserving progress
  const updatedExisting = existingBadges.map(existing => {
    const current = INITIAL_BADGES.find(b => b.id === existing.id)
    if (current) {
      return {
        ...current,
        unlocked: existing.unlocked,
        unlockedAt: existing.unlockedAt,
        progress: existing.progress
      }
    }
    return existing
  })
  
  return [...updatedExisting, ...newBadges]
}

export const useGamification = create<GamificationState>()(
  persist(
    (set, get) => ({
      stats: {
        level: 1,
        xp: 0,
        nextLevelXp: XP_PER_LEVEL,
        totalXp: 0,
        streakDays: 0,
        longestStreak: 0,
        tasksCompleted: 0,
        tasksCompletedEarly: 0,
        studyHours: 0,
        scheduleBlocksCompleted: 0,
        perfectWeeks: 0,
        classesAttended: 0,
        attendanceStreak: 0,
        longestAttendanceStreak: 0,
        badges: INITIAL_BADGES,
        dailyQuests: [],
        lastActiveDate: new Date().toISOString().split('T')[0],
        // Streak freeze system
        streakFreezeActive: false,
        streakFreezeStartDate: null,
        streakFreezeEndDate: null,
        streakFreezeReason: null,
        frozenStreakDays: 0,
        attendanceStreakFreezeActive: false,
        frozenAttendanceStreak: 0
      },

      updateStats: (updates) => set((state) => ({
        stats: { ...state.stats, ...updates }
      })),

      addXP: (amount) => set((state) => {
        const newTotalXP = state.stats.totalXp + amount
        const newLevel = calculateLevelFromXP(newTotalXP)
        const oldLevel = state.stats.level
        
        const newState = {
          stats: {
            ...state.stats,
            xp: state.stats.xp + amount,
            totalXp: newTotalXP,
            level: newLevel,
            nextLevelXp: calculateNextLevelXP(newLevel)
          }
        }
        
        // Trigger level up notification if level increased
        if (newLevel > oldLevel) {
          // Use setTimeout to trigger notification after state update
          setTimeout(() => {
            notificationService.showLevelUpNotification(newLevel, amount)
          }, 0)
        }
        
        return newState
      }),

      unlockBadge: (badgeId) => set((state) => {
        const badge = state.stats.badges.find(b => b.id === badgeId)
        const newState = {
          stats: {
            ...state.stats,
            badges: state.stats.badges.map(badge =>
              badge.id === badgeId
                ? { ...badge, unlocked: true, unlockedAt: new Date().toISOString() }
                : badge
            )
          }
        }
        
        // Trigger badge notification
        if (badge && !badge.unlocked) {
          setTimeout(() => {
            notificationService.showBadgeNotification(badge.name, badge.icon, badgeId)
          }, 0)
        }
        
        return newState
      }),

      completeQuest: (questId) => set((state) => {
        const quest = state.stats.dailyQuests.find(q => q.id === questId)
        const newState = {
          stats: {
            ...state.stats,
            dailyQuests: state.stats.dailyQuests.map(quest =>
              quest.id === questId ? { ...quest, completed: true } : quest
            )
          }
        }
        
        // Trigger quest completion notification
        if (quest && !quest.completed) {
          setTimeout(() => {
            notificationService.showQuestCompletedNotification(quest.title, quest.xpReward)
          }, 0)
        }
        
        return newState
      }),

      updateQuestProgress: (type, amount = 1) => set((state) => {
        const today = new Date().toISOString().split('T')[0]
        
        const updatedQuests = state.stats.dailyQuests.map(quest => {
          // Only update quests for today that match the type and aren't completed
          if (quest.date === today && quest.type === type && !quest.completed) {
            const newProgress = Math.min(quest.progress + amount, quest.target)
            const isCompleted = newProgress >= quest.target
            
            // If quest is completed, trigger notification and add XP
            if (isCompleted && !quest.completed) {
              setTimeout(() => {
                notificationService.showQuestCompletedNotification(quest.title, quest.xpReward)
                
                // Add XP reward for completing the quest
                const store = useGamification.getState()
                store.addXP(quest.xpReward)
              }, 100)
            }
            
            return {
              ...quest,
              progress: newProgress,
              completed: isCompleted
            }
          }
          return quest
        })
        
        return {
          stats: {
            ...state.stats,
            dailyQuests: updatedQuests
          }
        }
      }),

      generateDailyQuests: () => set((state) => {
        const today = new Date().toISOString().split('T')[0]
        
        // Don't regenerate if quests already exist for today
        if (state.stats.dailyQuests.some(q => q.date === today)) {
          return state
        }

        // Generate 3 random quests for today
        const shuffled = [...QUEST_TEMPLATES].sort(() => 0.5 - Math.random())
        const newQuests: DailyQuest[] = shuffled.slice(0, 3).map((template, index) => ({
          id: `${today}-${index}`,
          title: template.title,
          description: template.description,
          type: template.type as 'task' | 'study' | 'schedule' | 'academic',
          target: template.target,
          progress: 0,
          completed: false,
          xpReward: template.xp,
          date: today
        }))

        return {
          stats: {
            ...state.stats,
            dailyQuests: [
              ...state.stats.dailyQuests.filter(q => q.date !== today),
              ...newQuests
            ]
          }
        }
      }),

      checkAchievements: () => set((state) => {
        const { stats } = state
        let updatedBadges = [...stats.badges]

        // Check all badge conditions
        updatedBadges = updatedBadges.map(badge => {
          if (badge.unlocked) return badge

          let shouldUnlock = false
          let newProgress = badge.progress || 0

          switch (badge.id) {
            case 'first_task':
              newProgress = stats.tasksCompleted
              shouldUnlock = stats.tasksCompleted >= 1
              break
            case 'task_streak':
              newProgress = Math.min(stats.tasksCompleted, 10)
              shouldUnlock = stats.tasksCompleted >= 10
              break
            case 'early_bird':
              newProgress = stats.tasksCompletedEarly
              shouldUnlock = stats.tasksCompletedEarly >= 5
              break
            case 'perfect_week':
              newProgress = stats.perfectWeeks
              shouldUnlock = stats.perfectWeeks >= 1
              break
            case 'study_warrior':
              newProgress = Math.min(stats.studyHours, 25)
              shouldUnlock = stats.studyHours >= 25
              break
            case 'schedule_master':
              newProgress = stats.scheduleBlocksCompleted
              shouldUnlock = stats.scheduleBlocksCompleted >= 50
              break
            case 'time_keeper':
              newProgress = Math.min(stats.scheduleBlocksCompleted, 100)
              shouldUnlock = stats.scheduleBlocksCompleted >= 100
              break
            case 'goal_crusher':
              newProgress = stats.tasksCompleted
              shouldUnlock = stats.tasksCompleted >= 100
              break
            case 'consistency_king':
              newProgress = stats.streakDays
              shouldUnlock = stats.streakDays >= 30
              break
            case 'perfect_attendance':
              newProgress = stats.attendanceStreak
              shouldUnlock = stats.attendanceStreak >= 30
              break
            case 'attendance_streak':
              newProgress = stats.attendanceStreak
              shouldUnlock = stats.attendanceStreak >= 7
              break
            case 'first_class':
              newProgress = stats.classesAttended
              shouldUnlock = stats.classesAttended >= 1
              break
            case 'class_warrior':
              newProgress = stats.classesAttended
              shouldUnlock = stats.classesAttended >= 50
              break
            case 'attendance_champion':
              // This will be checked with additional logic from attendance store
              newProgress = stats.attendanceStreak
              shouldUnlock = stats.attendanceStreak >= 30
              break
            case 'never_miss':
              newProgress = stats.classesAttended
              shouldUnlock = stats.classesAttended >= 100
              break
            case 'semester_perfect':
              newProgress = stats.attendanceStreak
              shouldUnlock = stats.attendanceStreak >= 120
              break
            case 'monthly_perfect':
              newProgress = stats.attendanceStreak
              shouldUnlock = stats.attendanceStreak >= 30
              break
            case 'attendance_legend':
              newProgress = Math.min(365, stats.classesAttended)
              shouldUnlock = stats.classesAttended >= 365
              break
            case 'class_dedication':
              newProgress = stats.classesAttended
              shouldUnlock = stats.classesAttended >= 200
              break
            case 'gpa_achiever':
              // This will be checked from course planner when GPA is calculated
              newProgress = badge.progress || 0
              shouldUnlock = newProgress >= 1
              break
            case 'academic_foundation':
              // This will be checked from course planner for maintaining GPA
              newProgress = badge.progress || 0
              shouldUnlock = newProgress >= 30
              break
            case 'course_planner':
              // This will be triggered when first course is added
              newProgress = badge.progress || 0
              shouldUnlock = newProgress >= 1
              break
            case 'schedule_architect':
              // This will be triggered when weekly schedule is set up
              newProgress = badge.progress || 0
              shouldUnlock = newProgress >= 1
              break
            case 'semester_organizer':
              // This will be triggered when 5+ courses are planned
              newProgress = badge.progress || 0
              shouldUnlock = newProgress >= 5
              break
            case 'academic_starter':
              // This will be triggered when both course and schedule are set up
              newProgress = badge.progress || 0
              shouldUnlock = newProgress >= 1
              break
            case 'grade_warrior':
              // This will be triggered when tracking 10+ assignments
              newProgress = badge.progress || 0
              shouldUnlock = newProgress >= 10
              break
            case 'dean_list':
              // This will be triggered when achieving 3.8+ GPA
              newProgress = badge.progress || 0
              shouldUnlock = newProgress >= 1
              break
          }

          return {
            ...badge,
            progress: newProgress,
            unlocked: shouldUnlock,
            unlockedAt: shouldUnlock ? new Date().toISOString() : badge.unlockedAt
          }
        })

        return {
          stats: {
            ...stats,
            badges: updatedBadges
          }
        }
      }),

      resetStreak: () => set((state) => ({
        stats: {
          ...state.stats,
          streakDays: 0
        }
      })),

      incrementStreak: () => set((state) => ({
        stats: {
          ...state.stats,
          streakDays: state.stats.streakDays + 1,
          longestStreak: Math.max(state.stats.longestStreak, state.stats.streakDays + 1),
          lastActiveDate: new Date().toISOString().split('T')[0]
        }
      })),

      // Streak freeze methods
      activateStreakFreeze: (reason: string, startDate?: string, endDate?: string) => set((state) => ({
        stats: {
          ...state.stats,
          streakFreezeActive: true,
          streakFreezeStartDate: startDate || new Date().toISOString().split('T')[0],
          streakFreezeEndDate: endDate || null,
          streakFreezeReason: reason,
          frozenStreakDays: state.stats.streakDays
        }
      })),

      deactivateStreakFreeze: () => set((state) => ({
        stats: {
          ...state.stats,
          streakFreezeActive: false,
          streakFreezeStartDate: null,
          streakFreezeEndDate: null,
          streakFreezeReason: null,
          frozenStreakDays: 0
        }
      })),

      activateAttendanceStreakFreeze: () => set((state) => ({
        stats: {
          ...state.stats,
          attendanceStreakFreezeActive: true,
          frozenAttendanceStreak: state.stats.attendanceStreak
        }
      })),

      deactivateAttendanceStreakFreeze: () => set((state) => ({
        stats: {
          ...state.stats,
          attendanceStreakFreezeActive: false,
          frozenAttendanceStreak: 0
        }
      })),

      isStreakFrozen: () => {
        const state = get()
        return state.stats.streakFreezeActive
      },

      isAttendanceStreakFrozen: () => {
        const state = get()
        return state.stats.attendanceStreakFreezeActive
      },

      getEffectiveStreak: () => {
        const state = get()
        return state.stats.streakFreezeActive ? state.stats.frozenStreakDays : state.stats.streakDays
      },

      getEffectiveAttendanceStreak: () => {
        const state = get()
        return state.stats.attendanceStreakFreezeActive ? state.stats.frozenAttendanceStreak : state.stats.attendanceStreak
      }
    }),
    {
      name: 'aq:gamification',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Migrate badges for existing users
          state.stats.badges = migrateBadges(state.stats.badges)
        }
      }
    }
  )
)
