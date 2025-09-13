import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Trophy, Target, Calendar, Award, Zap, Crown, Snowflake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGamification } from '@/store/gamificationStore'
import { StreakFreezePanel } from './StreakFreezePanel'

interface GamificationPanelProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'status' | 'badges' | 'quests'
}

export function GamificationPanel({ isOpen, onClose, defaultTab = 'status' }: GamificationPanelProps) {
  const { stats, generateDailyQuests, checkAchievements } = useGamification()
  const [streakFreezeOpen, setStreakFreezeOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      generateDailyQuests()
      checkAchievements()
    }
  }, [isOpen, generateDailyQuests, checkAchievements])

  // Map defaultTab to actual tab values
  const getTabValue = (tab: string) => {
    switch (tab) {
      case 'status': return 'overview'
      case 'badges': return 'badges'
      case 'quests': return 'quests'
      default: return 'overview'
    }
  }

  const xpProgress = ((stats.xp % 500) / 500) * 100
  const unlockedBadges = stats.badges.filter(b => b.unlocked)
  const lockedBadges = stats.badges.filter(b => !b.unlocked)
  const todayQuests = stats.dailyQuests.filter(q => q.date === new Date().toISOString().split('T')[0])
  const completedQuests = todayQuests.filter(q => q.completed)

  // Categorize badges
  const attendanceBadgeIds = ['first_class', 'attendance_streak', 'perfect_attendance', 'class_warrior', 
                             'attendance_champion', 'never_miss', 'semester_perfect', 'monthly_perfect', 
                             'attendance_legend', 'class_dedication']
  const taskBadgeIds = ['first_task', 'task_streak', 'early_bird', 'goal_crusher']
  const studyBadgeIds = ['study_warrior', 'time_keeper']

  const getBadgeCategory = (badgeId: string) => {
    if (attendanceBadgeIds.includes(badgeId)) return 'attendance'
    if (taskBadgeIds.includes(badgeId)) return 'tasks'
    if (studyBadgeIds.includes(badgeId)) return 'study'
    return 'general'
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'attendance': return '📚'
      case 'tasks': return '✅'
      case 'study': return '📖'
      default: return '🎯'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
          className="bg-gradient-to-br from-white to-slate-50/90 dark:from-neutral-900 dark:to-neutral-800/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 dark:border-neutral-700/30 w-full max-w-5xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200/50 dark:border-neutral-700/50 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 dark:from-purple-900/20 dark:to-indigo-900/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Adventurer Status
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 font-medium">Level {stats.level} Academic Explorer</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setStreakFreezeOpen(true)}
                className="rounded-xl border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
              >
                <Snowflake className="w-4 h-4 mr-2" />
                Streak Freeze
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onClose} 
                className="rounded-2xl border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Level Progress */}
            <Card className="rounded-2xl border-0 bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-950/30 dark:to-indigo-900/30 shadow-lg hover:shadow-xl transition-all duration-200 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-300">Level {stats.level}</h3>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        {stats.xp} / {stats.nextLevelXp} XP
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">🔥 Current Streak</p>
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{stats.streakDays} days</p>
                  </div>
                </div>
                
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-4 mb-3 shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg"
                  />
                </div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {500 - (stats.xp % 500)} XP to next level
                </p>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue={getTabValue(defaultTab)} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/80 p-1 backdrop-blur-sm">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-xl bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-neutral-700 font-semibold transition-all duration-200"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="quests" 
                  className="rounded-xl bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-neutral-700 font-semibold transition-all duration-200"
                >
                  Daily Quests
                </TabsTrigger>
                <TabsTrigger 
                  value="badges" 
                  className="rounded-xl bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-neutral-700 font-semibold transition-all duration-200"
                >
                  Badges
                </TabsTrigger>
                <TabsTrigger 
                  value="stats" 
                  className="rounded-xl bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-neutral-700 font-semibold transition-all duration-200"
                >
                  Stats
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/30 dark:to-teal-900/30 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        Today's Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-neutral-800/60 rounded-xl">
                          <span className="font-medium text-emerald-700 dark:text-emerald-300">Daily Quests</span>
                          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
                            {completedQuests.length}/{todayQuests.length}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-neutral-800/60 rounded-xl">
                          <span className="font-medium text-emerald-700 dark:text-emerald-300">Streak</span>
                          <Badge className="bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0">
                            {stats.streakDays} days
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-neutral-800/60 rounded-xl">
                          <span className="font-medium text-emerald-700 dark:text-emerald-300">Badges Earned</span>
                          <Badge className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0">
                            {unlockedBadges.length}/{stats.badges.length}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-900/30 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        Recent Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {unlockedBadges.length > 0 ? (
                        <div className="space-y-3">
                          {unlockedBadges
                            .sort((a, b) => (b.unlockedAt || '').localeCompare(a.unlockedAt || ''))
                            .slice(0, 3)
                            .map((badge) => (
                              <div key={badge.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 dark:bg-neutral-800/60 hover:bg-white/80 dark:hover:bg-neutral-700/80 transition-all duration-200">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-lg shadow-md">
                                  {badge.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-amber-700 dark:text-amber-300 truncate">{badge.name}</p>
                                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                    {badge.unlockedAt ? new Date(badge.unlockedAt).toLocaleDateString() : ''}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-800 dark:to-orange-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Trophy className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                          </div>
                          <p className="font-semibold text-amber-700 dark:text-amber-300 mb-2">No badges unlocked yet</p>
                          <p className="text-sm text-amber-600 dark:text-amber-400">Complete tasks to earn your first badge!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="quests" className="space-y-6">
                <Card className="rounded-2xl border-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      Today's Quests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {todayQuests.length > 0 ? (
                      <div className="space-y-4">
                        {todayQuests.map((quest) => (
                          <div
                            key={quest.id}
                            className={`p-5 rounded-2xl border-0 transition-all duration-200 shadow-md hover:shadow-lg ${
                              quest.completed
                                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40'
                                : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-lg text-neutral-800 dark:text-neutral-100">{quest.title}</h4>
                              <div className="flex items-center gap-3">
                                <Badge className={`${quest.completed 
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0' 
                                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0'
                                } px-3 py-1`}>
                                  {quest.progress}/{quest.target}
                                </Badge>
                                <span className="text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                                  +{quest.xpReward} XP
                                </span>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4">
                              {quest.description}
                            </p>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3 shadow-inner">
                              <div
                                className={`h-3 rounded-full transition-all duration-500 shadow-sm ${
                                  quest.completed 
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600' 
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                }`}
                                style={{ width: `${Math.min((quest.progress / quest.target) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-200 to-indigo-300 dark:from-blue-800 dark:to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="font-semibold text-blue-700 dark:text-blue-300 mb-2">No quests available today</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">New quests will be generated tomorrow!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="badges" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Unlocked Badges */}
                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/30 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        Earned Badges ({unlockedBadges.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {unlockedBadges.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {unlockedBadges.map((badge) => {
                            const category = getBadgeCategory(badge.id)
                            const categoryIcon = getCategoryIcon(category)
                            
                            return (
                              <div
                                key={badge.id}
                                className="p-4 rounded-2xl bg-white/60 dark:bg-neutral-800/60 border border-emerald-200/50 dark:border-emerald-700/50 hover:bg-white/80 dark:hover:bg-neutral-700/80 transition-all duration-200 relative shadow-md"
                              >
                                {/* Category indicator */}
                                <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-xs">
                                  {categoryIcon}
                                </div>
                                
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-2xl mb-3 mx-auto shadow-lg">
                                    {badge.icon}
                                  </div>
                                  <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-300 mb-1">{badge.name}</p>
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">{badge.description}</p>
                                  {badge.unlockedAt && (
                                    <p className="text-xs text-emerald-500 dark:text-emerald-500 font-medium">
                                      {new Date(badge.unlockedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-20 h-20 bg-gradient-to-br from-emerald-200 to-teal-300 dark:from-emerald-800 dark:to-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Award className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <p className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">No badges earned yet</p>
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">Complete your first task to get started!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Locked Badges */}
                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-slate-50 to-neutral-100 dark:from-slate-950/30 dark:to-neutral-900/30 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 bg-gradient-to-br from-slate-500 to-neutral-600 rounded-xl">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        Available Badges ({lockedBadges.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {lockedBadges.map((badge) => {
                          const category = getBadgeCategory(badge.id)
                          const categoryIcon = getCategoryIcon(category)
                          
                          return (
                            <div
                              key={badge.id}
                              className="p-4 rounded-2xl bg-white/40 dark:bg-neutral-800/40 border border-slate-200/50 dark:border-slate-700/50 opacity-75 hover:opacity-90 transition-all duration-200 relative"
                            >
                              {/* Category indicator */}
                              <div className="absolute top-2 right-2 w-6 h-6 bg-slate-100 dark:bg-slate-800/60 rounded-full flex items-center justify-center text-xs">
                                {categoryIcon}
                              </div>
                              
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-slate-300 to-neutral-400 dark:from-slate-700 dark:to-neutral-600 rounded-2xl flex items-center justify-center text-2xl mb-3 mx-auto grayscale">
                                  {badge.icon}
                                </div>
                                <p className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-1">{badge.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">{badge.description}</p>
                                {badge.maxProgress && badge.maxProgress > 1 && (
                                  <>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2 shadow-inner">
                                      <div
                                        className="h-2 rounded-full bg-gradient-to-r from-slate-400 to-neutral-500 transition-all duration-300"
                                        style={{ width: `${Math.min(((badge.progress || 0) / badge.maxProgress) * 100, 100)}%` }}
                                      />
                                    </div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                      {badge.progress || 0}/{badge.maxProgress}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-900/30 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-1">{stats.tasksCompleted}</p>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Tasks Completed</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/30 dark:to-teal-900/30 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-1">{stats.tasksCompletedEarly}</p>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Early Completions</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950/30 dark:to-violet-900/30 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mb-1">{stats.studyHours % 1 === 0 ? stats.studyHours : stats.studyHours.toFixed(1)}h</p>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Study Hours</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/30 dark:to-amber-900/30 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-orange-700 dark:text-orange-300 mb-1">{stats.scheduleBlocksCompleted}</p>
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Schedule Blocks</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950/30 dark:to-pink-900/30 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-rose-700 dark:text-rose-300 mb-1">{stats.classesAttended}</p>
                        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Classes Attended</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-950/30 dark:to-cyan-900/30 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-teal-700 dark:text-teal-300 mb-1">{stats.attendanceStreak}</p>
                        <p className="text-sm font-medium text-teal-600 dark:text-teal-400">Attendance Streak</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950/30 dark:to-amber-900/30 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mb-1">{stats.longestStreak}</p>
                        <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Longest Streak</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/30 dark:to-rose-900/30 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-pink-700 dark:text-pink-300 mb-1">{stats.longestAttendanceStreak}</p>
                        <p className="text-sm font-medium text-pink-600 dark:text-pink-400">Longest Attendance</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-950/30 dark:to-purple-900/30 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 mb-1">{stats.totalXp}</p>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Total XP</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </motion.div>

      {/* Streak Freeze Panel */}
      <StreakFreezePanel 
        isOpen={streakFreezeOpen} 
        onClose={() => setStreakFreezeOpen(false)} 
      />
    </AnimatePresence>
  )
}
