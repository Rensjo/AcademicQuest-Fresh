import { useGamification } from './gamificationStore'
import { useCallback } from 'react'
import { notificationService } from '@/services/notificationService'

// XP rewards for different actions
export const XP_REWARDS = {
  TASK_COMPLETE: 25,
  TASK_EARLY: 50,
  TASK_ON_TIME: 35,
  STUDY_SESSION: 15,
  SCHEDULE_BLOCK: 20,
  COURSE_ADD: 30,
  DAILY_LOGIN: 10,
  WEEK_PERFECT: 100,
  CLASS_ATTENDANCE: 15,
  FIRST_COURSE: 50,
  SCHEDULE_SETUP: 75,
  GPA_MILESTONE: 100,
  GRADE_ENTRY: 10,
} as const

// Helper function to check if task is completed early
export function isTaskEarly(dueDate?: string): boolean {
  if (!dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return today < due
}

// Helper function to check if task is on time
export function isTaskOnTime(dueDate?: string): boolean {
  if (!dueDate) return true
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return today <= due
}

// Non-hook version for use in stores
export const rewardTaskCompletion = (dueDate?: string) => {
  console.log('🎯 rewardTaskCompletion called with dueDate:', dueDate)
  const store = useGamification.getState()
  const isEarly = isTaskEarly(dueDate)
  const isOnTime = isTaskOnTime(dueDate)
  
  let xpReward: number
  
  if (isEarly) {
    xpReward = XP_REWARDS.TASK_EARLY
    store.addXP(xpReward)
    store.updateStats({ 
      tasksCompleted: store.stats.tasksCompleted + 1,
      tasksCompletedEarly: store.stats.tasksCompletedEarly + 1 
    })
    console.log('✅ Task completed early, XP reward:', xpReward)
  } else if (isOnTime) {
    xpReward = XP_REWARDS.TASK_ON_TIME
    store.addXP(xpReward)
    store.updateStats({ tasksCompleted: store.stats.tasksCompleted + 1 })
    console.log('✅ Task completed on time, XP reward:', xpReward)
  } else {
    xpReward = XP_REWARDS.TASK_COMPLETE
    store.addXP(xpReward)
    store.updateStats({ tasksCompleted: store.stats.tasksCompleted + 1 })
    console.log('✅ Task completed, XP reward:', xpReward)
  }
  
  // Trigger task completion notification
  console.log('🔔 Triggering task completion notification...')
  setTimeout(() => {
    notificationService.showTaskCompletedNotification(xpReward, isEarly)
  }, 0)
  
  // Update quest progress for task-related quests
  if (isEarly) {
    // Update both regular task quest and early task quest
    store.updateQuestProgress('task', 1)
  } else {
    store.updateQuestProgress('task', 1)
  }
  
  store.checkAchievements()
}

export const rewardStudySession = (durationMinutes: number) => {
  const store = useGamification.getState()
  const xp = Math.floor(durationMinutes / 25) * XP_REWARDS.STUDY_SESSION // XP per 25-minute session
  store.addXP(xp)
  
  const currentHours = store.stats.studyHours
  store.updateStats({ studyHours: currentHours + (durationMinutes / 60) })
  
  // Update study quest progress (typically measured in hours)
  const hoursStudied = durationMinutes / 60
  store.updateQuestProgress('study', hoursStudied)
  
  store.checkAchievements()
}

export const rewardClassAttendance = () => {
  const store = useGamification.getState()
  store.addXP(XP_REWARDS.CLASS_ATTENDANCE)
  store.updateStats({ 
    classesAttended: store.stats.classesAttended + 1
  })
  store.checkAchievements()
}

export const updateAttendanceStreak = (perfectDay: boolean) => {
  const store = useGamification.getState()
  if (perfectDay) {
    const newStreak = store.stats.attendanceStreak + 1
    const newLongest = Math.max(store.stats.longestAttendanceStreak, newStreak)
    store.updateStats({
      attendanceStreak: newStreak,
      longestAttendanceStreak: newLongest
    })
  } else {
    store.updateStats({
      attendanceStreak: 0
    })
  }
  store.checkAchievements()
}

export const rewardScheduleBlock = () => {
  const store = useGamification.getState()
  store.addXP(XP_REWARDS.SCHEDULE_BLOCK)
  store.updateStats({ 
    scheduleBlocksCompleted: store.stats.scheduleBlocksCompleted + 1 
  })
  
  // Update schedule quest progress
  store.updateQuestProgress('schedule', 1)
  
  store.checkAchievements()
}

// Gamification actions that can be called from anywhere in the app
export function useGamificationActions() {
  const { addXP, updateStats, checkAchievements, incrementStreak } = useGamification()

  const rewardTaskCompletionHook = useCallback((dueDate?: string) => {
    const isEarly = isTaskEarly(dueDate)
    const isOnTime = isTaskOnTime(dueDate)
    
    if (isEarly) {
      addXP(XP_REWARDS.TASK_EARLY)
      updateStats({ 
        tasksCompleted: useGamification.getState().stats.tasksCompleted + 1,
        tasksCompletedEarly: useGamification.getState().stats.tasksCompletedEarly + 1 
      })
    } else if (isOnTime) {
      addXP(XP_REWARDS.TASK_ON_TIME)
      updateStats({ tasksCompleted: useGamification.getState().stats.tasksCompleted + 1 })
    } else {
      addXP(XP_REWARDS.TASK_COMPLETE)
      updateStats({ tasksCompleted: useGamification.getState().stats.tasksCompleted + 1 })
    }
    
    // Update quest progress for task completion
    useGamification.getState().updateQuestProgress('task', 1)
    
    checkAchievements()
  }, [addXP, updateStats, checkAchievements])

  const rewardStudySessionHook = useCallback((durationMinutes: number) => {
    const xp = Math.floor(durationMinutes / 25) * XP_REWARDS.STUDY_SESSION
    addXP(xp)
    
    const currentHours = useGamification.getState().stats.studyHours
    updateStats({ studyHours: currentHours + (durationMinutes / 60) })
    
    checkAchievements()
  }, [addXP, updateStats, checkAchievements])

  const rewardScheduleBlock = useCallback(() => {
    addXP(XP_REWARDS.SCHEDULE_BLOCK)
    updateStats({ 
      scheduleBlocksCompleted: useGamification.getState().stats.scheduleBlocksCompleted + 1 
    })
    
    // Update schedule quest progress
    useGamification.getState().updateQuestProgress('schedule', 1)
    
    checkAchievements()
  }, [addXP, updateStats, checkAchievements])

  const rewardCourseAdd = useCallback(() => {
    addXP(XP_REWARDS.COURSE_ADD)
    checkAchievements()
  }, [addXP, checkAchievements])

  const rewardDailyLogin = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    const lastActive = useGamification.getState().stats.lastActiveDate
    
    if (lastActive !== today) {
      addXP(XP_REWARDS.DAILY_LOGIN)
      incrementStreak()
      checkAchievements()
    }
  }, [addXP, incrementStreak, checkAchievements])

  return {
    rewardTaskCompletion: rewardTaskCompletionHook,
    rewardStudySession: rewardStudySessionHook,
    rewardScheduleBlock,
    rewardCourseAdd,
    rewardDailyLogin,
    checkAchievements
  }
}

// New helper functions for course and academic achievements
export const rewardFirstCourse = () => {
  const store = useGamification.getState()
  store.addXP(XP_REWARDS.FIRST_COURSE)
  
  // Update course planner badge
  const badges = store.stats.badges.map(badge => 
    badge.id === 'course_planner' 
      ? { ...badge, progress: 1 }
      : badge
  )
  store.updateStats({ badges })
  store.checkAchievements()
}

export const checkSemesterOrganizer = (courseCount: number) => {
  const store = useGamification.getState()
  
  // Update semester organizer badge progress
  const badges = store.stats.badges.map(badge => 
    badge.id === 'semester_organizer' 
      ? { ...badge, progress: Math.min(courseCount, 5) }
      : badge
  )
  store.updateStats({ badges })
  store.checkAchievements()
}

export const rewardScheduleSetup = () => {
  const store = useGamification.getState()
  store.addXP(XP_REWARDS.SCHEDULE_SETUP)
  
  // Update schedule architect badge
  const badges = store.stats.badges.map(badge => 
    badge.id === 'schedule_architect' 
      ? { ...badge, progress: 1 }
      : badge
  )
  store.updateStats({ badges })
  
  // Check if both course and schedule are set up for academic starter
  checkAcademicStarter()
  store.checkAchievements()
}

export const checkAcademicStarter = () => {
  const store = useGamification.getState()
  const badges = store.stats.badges
  
  const coursePlannerBadge = badges.find(b => b.id === 'course_planner')
  const scheduleArchitectBadge = badges.find(b => b.id === 'schedule_architect')
  
  // If both course planner and schedule architect have progress, unlock academic starter
  if (coursePlannerBadge?.progress && scheduleArchitectBadge?.progress) {
    const updatedBadges = badges.map(badge => 
      badge.id === 'academic_starter' 
        ? { ...badge, progress: 1 }
        : badge
    )
    store.updateStats({ badges: updatedBadges })
    store.checkAchievements()
  }
}

export const checkGPABadges = (gpa: number) => {
  const store = useGamification.getState()
  
  let badges = [...store.stats.badges]
  let xpBonus = 0
  
  // Check GPA Achiever (3.0+)
  if (gpa >= 3.0) {
    badges = badges.map(badge => 
      badge.id === 'gpa_achiever' 
        ? { ...badge, progress: 1 }
        : badge
    )
    xpBonus += XP_REWARDS.GPA_MILESTONE
  }
  
  // Check Dean's List (3.8+)
  if (gpa >= 3.8) {
    badges = badges.map(badge => 
      badge.id === 'dean_list' 
        ? { ...badge, progress: 1 }
        : badge
    )
    xpBonus += XP_REWARDS.GPA_MILESTONE * 2
  }
  
  if (xpBonus > 0) {
    store.addXP(xpBonus)
  }
  
  store.updateStats({ badges })
  store.checkAchievements()
}

export const updateGPAStreak = (gpa: number, days: number) => {
  const store = useGamification.getState()
  
  // Check Academic Foundation (3.5+ GPA for 30 days)
  if (gpa >= 3.5) {
    const badges = store.stats.badges.map(badge => 
      badge.id === 'academic_foundation' 
        ? { ...badge, progress: Math.min(days, 30) }
        : badge
    )
    store.updateStats({ badges })
    store.checkAchievements()
  }
}

export const rewardGradeEntry = () => {
  const store = useGamification.getState()
  store.addXP(XP_REWARDS.GRADE_ENTRY)
}

export const checkGradeWarrior = (assignmentCount: number) => {
  const store = useGamification.getState()
  
  const badges = store.stats.badges.map(badge => 
    badge.id === 'grade_warrior' 
      ? { ...badge, progress: Math.min(assignmentCount, 10) }
      : badge
  )
  store.updateStats({ badges })
  store.checkAchievements()
}
