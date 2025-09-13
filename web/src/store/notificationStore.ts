import { create } from 'zustand'

export type NotificationType = 'level_up' | 'badge_earned' | 'task_completed' | 'quest_completed'

export interface GameNotification {
  id: string
  type: NotificationType
  title: string
  description: string
  icon?: string
  xpGained?: number
  level?: number
  badgeId?: string
  timestamp: number
  duration?: number // in milliseconds, default 4000
}

interface NotificationState {
  notifications: GameNotification[]
  addNotification: (notification: Omit<GameNotification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

export const useNotifications = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    console.log('📢 Adding notification to store:', notification)
    const id = crypto.randomUUID()
    const newNotification: GameNotification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration || 4000
    }
    
    console.log('📢 Complete notification object:', newNotification)

    set((state) => {
      console.log('📢 Current notifications before add:', state.notifications.length)
      const newState = {
        notifications: [...state.notifications, newNotification]
      }
      console.log('📢 New notifications array length:', newState.notifications.length)
      return newState
    })

    console.log('📢 Store state after add:', get().notifications.length)

    // Auto-remove after duration
    setTimeout(() => {
      get().removeNotification(id)
    }, newNotification.duration)
  },

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  clearAll: () => set({ notifications: [] })
}))

// Helper functions to create specific notifications
export const createLevelUpNotification = (newLevel: number, xpGained: number): Omit<GameNotification, 'id' | 'timestamp'> => ({
  type: 'level_up',
  title: 'Level Up!',
  description: `You've reached Level ${newLevel}!`,
  icon: '🎉',
  level: newLevel,
  xpGained,
  duration: 5000
})

export const createBadgeNotification = (badgeName: string, badgeIcon: string, badgeId: string): Omit<GameNotification, 'id' | 'timestamp'> => ({
  type: 'badge_earned',
  title: 'Badge Earned!',
  description: `You've unlocked "${badgeName}"!`,
  icon: badgeIcon,
  badgeId,
  duration: 5000
})

export const createTaskCompletedNotification = (xpGained: number, isEarly?: boolean): Omit<GameNotification, 'id' | 'timestamp'> => ({
  type: 'task_completed',
  title: isEarly ? 'Task Completed Early!' : 'Task Completed!',
  description: `Great job! +${xpGained} XP${isEarly ? ' (Early bonus!)' : ''}`,
  icon: isEarly ? '⚡' : '✅',
  xpGained,
  duration: 3000
})

export const createQuestCompletedNotification = (questTitle: string, xpGained: number): Omit<GameNotification, 'id' | 'timestamp'> => ({
  type: 'quest_completed',
  title: 'Quest Completed!',
  description: `"${questTitle}" - +${xpGained} XP`,
  icon: '🏆',
  xpGained,
  duration: 4000
})
