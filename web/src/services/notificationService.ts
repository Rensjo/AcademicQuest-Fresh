import { useNotifications, createLevelUpNotification, createBadgeNotification, createTaskCompletedNotification, createQuestCompletedNotification } from '@/store/notificationStore'
import { soundService } from './soundService'

class NotificationService {
  private static instance: NotificationService
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  showLevelUpNotification(newLevel: number, xpGained: number) {
    console.log('🎉 Level up notification triggered:', { newLevel, xpGained })
    try {
      const { addNotification } = useNotifications.getState()
      addNotification(createLevelUpNotification(newLevel, xpGained))
      
      // Play level up sound
      soundService.playLevelUp()
      
      console.log('✅ Level up notification added successfully')
    } catch (error) {
      console.error('❌ Failed to show level up notification:', error)
    }
  }

  showBadgeNotification(badgeName: string, badgeIcon: string, badgeId: string) {
    console.log('🏆 Badge notification triggered:', { badgeName, badgeIcon, badgeId })
    try {
      const { addNotification } = useNotifications.getState()
      addNotification(createBadgeNotification(badgeName, badgeIcon, badgeId))
      
      // Play badge earned sound
      soundService.playBadgeEarned()
      
      console.log('✅ Badge notification added successfully')
    } catch (error) {
      console.error('❌ Failed to show badge notification:', error)
    }
  }

  showTaskCompletedNotification(xpGained: number, isEarly: boolean = false) {
    console.log('✅ Task completion notification triggered:', { xpGained, isEarly })
    try {
      const { addNotification } = useNotifications.getState()
      addNotification(createTaskCompletedNotification(xpGained, isEarly))
      
      // Play task completion sound
      soundService.playTaskComplete()
      
      console.log('✅ Task completion notification added successfully')
    } catch (error) {
      console.error('❌ Failed to show task completion notification:', error)
    }
  }

  showQuestCompletedNotification(questTitle: string, xpReward: number) {
    console.log('🎯 Quest completion notification triggered:', { questTitle, xpReward })
    try {
      const { addNotification } = useNotifications.getState()
      addNotification(createQuestCompletedNotification(questTitle, xpReward))
      
      // Play task completion sound for quest completion too
      soundService.playTaskComplete()
      
      console.log('✅ Quest completion notification added successfully')
    } catch (error) {
      console.error('❌ Failed to show quest completion notification:', error)
    }
  }
}

export const notificationService = NotificationService.getInstance()
