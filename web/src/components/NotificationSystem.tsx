import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Trophy, Target, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useNotifications, GameNotification, NotificationType } from '@/store/notificationStore'
import { soundService, SoundType } from '@/services/soundService'

// Map notification types to sound types
const getNotificationSound = (notificationType: NotificationType): SoundType => {
  switch (notificationType) {
    case 'level_up':
      return 'levelUp'
    case 'badge_earned':
      return 'badgeEarned'
    case 'task_completed':
    case 'quest_completed':
      return 'taskComplete'
    default:
      return 'taskComplete'
  }
}

interface NotificationPopupProps {
  notification: GameNotification
  onClose: (id: string) => void
}

function NotificationPopup({ notification, onClose }: NotificationPopupProps) {
  // Play sound when notification appears
  useEffect(() => {
    const soundType = getNotificationSound(notification.type)
    soundService.play(soundType)
    console.log('🔊 Playing notification sound:', soundType, 'for notification:', notification.type)
  }, [notification.type])

  const getIcon = () => {
    if (notification.icon) return notification.icon
    
    switch (notification.type) {
      case 'level_up':
        return <Star className="h-6 w-6 text-yellow-500" />
      case 'badge_earned':
        return <Trophy className="h-6 w-6 text-purple-500" />
      case 'task_completed':
        return <Target className="h-6 w-6 text-green-500" />
      case 'quest_completed':
        return <Zap className="h-6 w-6 text-blue-500" />
      default:
        return <Star className="h-6 w-6 text-gray-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'level_up':
        return 'from-yellow-500/20 to-orange-500/20 dark:from-yellow-400/20 dark:to-orange-400/20'
      case 'badge_earned':
        return 'from-purple-500/20 to-pink-500/20 dark:from-purple-400/20 dark:to-pink-400/20'
      case 'task_completed':
        return 'from-green-500/20 to-emerald-500/20 dark:from-green-400/20 dark:to-emerald-400/20'
      case 'quest_completed':
        return 'from-blue-500/20 to-indigo-500/20 dark:from-blue-400/20 dark:to-indigo-400/20'
      default:
        return 'from-gray-500/20 to-gray-600/20 dark:from-gray-400/20 dark:to-gray-500/20'
    }
  }

  const getRingColor = () => {
    switch (notification.type) {
      case 'level_up':
        return 'ring-yellow-200/50 dark:ring-yellow-400/30'
      case 'badge_earned':
        return 'ring-purple-200/50 dark:ring-purple-400/30'
      case 'task_completed':
        return 'ring-green-200/50 dark:ring-green-400/30'
      case 'quest_completed':
        return 'ring-blue-200/50 dark:ring-blue-400/30'
      default:
        return 'ring-gray-200/50 dark:ring-gray-400/30'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        duration: 0.4
      }}
      className="w-full max-w-sm"
    >
      <Card className={`border-0 shadow-2xl backdrop-blur-xl bg-gradient-to-br ${getBackgroundColor()} 
                        ring-2 ${getRingColor()} hover:shadow-3xl transition-all duration-300
                        hover:scale-[1.02] active:scale-[0.98]`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-shrink-0 p-2 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-sm"
            >
              {typeof notification.icon === 'string' ? (
                <span className="text-2xl">{notification.icon}</span>
              ) : (
                getIcon()
              )}
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <motion.h3 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1"
              >
                {notification.title}
              </motion.h3>
              
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed"
              >
                {notification.description}
              </motion.p>
              
              {notification.xpGained && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/30 dark:bg-black/30 backdrop-blur-sm"
                >
                  <Zap className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    +{notification.xpGained} XP
                  </span>
                </motion.div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClose(notification.id)}
              className="h-6 w-6 p-0 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors duration-200"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function CenterNotificationPopup({ notification, onClose }: NotificationPopupProps) {
  const getIcon = () => {
    if (notification.icon) return notification.icon
    
    switch (notification.type) {
      case 'level_up':
        return <Star className="h-12 w-12 text-yellow-500" />
      case 'badge_earned':
        return <Trophy className="h-12 w-12 text-purple-500" />
      default:
        return <Star className="h-12 w-12 text-gray-500" />
    }
  }

  const getBackgroundGradient = () => {
    switch (notification.type) {
      case 'level_up':
        return 'from-yellow-400/30 via-orange-500/30 to-red-500/30'
      case 'badge_earned':
        return 'from-purple-400/30 via-pink-500/30 to-indigo-500/30'
      default:
        return 'from-gray-400/30 via-gray-500/30 to-gray-600/30'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      exit={{ opacity: 0, scale: 0.8, rotateY: 15 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        duration: 0.8
      }}
      className="w-full max-w-md mx-4"
    >
      <Card className={`border-2 shadow-2xl backdrop-blur-3xl bg-gradient-to-br ${getBackgroundGradient()}
                        border-white/30 dark:border-gray-600/30 hover:shadow-3xl transition-all duration-500
                        hover:scale-[1.02] relative overflow-hidden`}>
        
        {/* Background sparkle effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
        
        <CardContent className="p-8 text-center relative">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 20,
              delay: 0.2 
            }}
            className="flex justify-center mb-6"
          >
            <div className="p-6 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-sm shadow-2xl">
              {typeof notification.icon === 'string' ? (
                <span className="text-6xl">{notification.icon}</span>
              ) : (
                getIcon()
              )}
            </div>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-3 drop-shadow-lg"
          >
            {notification.title}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-white/90 mb-6 leading-relaxed drop-shadow-md"
          >
            {notification.description}
          </motion.p>
          
          {notification.xpGained && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 dark:bg-black/30 backdrop-blur-sm shadow-lg"
            >
              <Zap className="h-5 w-5 text-yellow-300" />
              <span className="text-xl font-bold text-white drop-shadow-md">
                +{notification.xpGained} XP
              </span>
            </motion.div>
          )}
          
          {notification.type === 'level_up' && notification.level && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-6"
            >
              <div className="text-6xl font-bold text-white drop-shadow-lg mb-2">
                Level {notification.level}
              </div>
              <div className="text-white/80 text-lg">
                You've reached a new level!
              </div>
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              variant="secondary"
              onClick={() => onClose(notification.id)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 backdrop-blur-sm transition-all duration-200 px-8 py-3 text-lg font-semibold"
            >
              Awesome!
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function NotificationSystem() {
  const { notifications, removeNotification } = useNotifications()

  // Debug logging
  console.log('📱 NotificationSystem render - total notifications:', notifications.length)
  console.log('📱 All notifications:', notifications)

  // Separate notifications into corner and center types
  const cornerNotifications = notifications.filter(n => n.type === 'task_completed' || n.type === 'quest_completed')
  const centerNotifications = notifications.filter(n => n.type === 'level_up' || n.type === 'badge_earned')

  console.log('📱 Corner notifications:', cornerNotifications.length)
  console.log('📱 Center notifications:', centerNotifications.length)

  return (
    <>
      {/* Corner notifications (top-right) */}
      <div 
        className="fixed top-4 right-4 space-y-3 pointer-events-none"
        style={{ zIndex: 50000 }}
      >
        <AnimatePresence mode="popLayout">
          {cornerNotifications.map((notification) => (
            <div key={notification.id} className="pointer-events-auto">
              <NotificationPopup
                notification={notification}
                onClose={removeNotification}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Center notifications (major achievements) */}
      <div 
        className="fixed inset-0 pointer-events-none flex items-center justify-center"
        style={{ zIndex: 50001 }}
      >
        <AnimatePresence mode="popLayout">
          {centerNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -50 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 30,
                duration: 0.6
              }}
              className="pointer-events-auto mb-8"
            >
              <CenterNotificationPopup
                notification={notification}
                onClose={removeNotification}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}
