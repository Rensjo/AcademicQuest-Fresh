import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, TrendingUp, BarChart3, Clock, Target, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { useStudySessions, minutesByDay } from '@/store/studySessionsStore'
import { useGamification } from '@/store/gamificationStore'

interface StudyHoursPanelProps {
  isOpen: boolean
  onClose: () => void
}

// Enhanced chart color palette with vibrant gradients
const COLORS = [
  '#4f46e5', // Indigo
  '#7c3aed', // Violet  
  '#0891b2', // Cyan
  '#059669', // Emerald
  '#dc2626', // Red
  '#ea580c', // Orange
  '#ca8a04', // Yellow
  '#9333ea'  // Purple
]

export function StudyHoursPanel({ isOpen, onClose }: StudyHoursPanelProps) {
  const { sessions } = useStudySessions()
  const { getEffectiveStreak } = useGamification()
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'term'>('week')

  // Calculate date ranges for different periods
  const dateRanges = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 6)
    
    const monthStart = new Date(now)
    monthStart.setDate(now.getDate() - 29)
    
    const termStart = new Date(now)
    termStart.setMonth(now.getMonth() - 4) // ~4 months for a term
    
    return {
      week: { start: weekStart, end: now, label: '7 Days' },
      month: { start: monthStart, end: now, label: '30 Days' },
      term: { start: termStart, end: now, label: 'This Term' }
    }
  }, [])

  // Filter sessions for selected period
  const periodSessions = useMemo(() => {
    const range = dateRanges[selectedPeriod]
    return sessions.filter(s => {
      const sessionDate = new Date(s.start)
      return sessionDate >= range.start && sessionDate <= range.end
    })
  }, [sessions, selectedPeriod, dateRanges])

  // Calculate analytics for selected period
  const analytics = useMemo(() => {
    const totalMinutes = periodSessions.reduce((sum, s) => sum + s.durationMin, 0)
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10
    const avgPerDay = Math.round(totalMinutes / ((dateRanges[selectedPeriod].end.getTime() - dateRanges[selectedPeriod].start.getTime()) / (1000 * 60 * 60 * 24)) * 10) / 10
    
    // Source breakdown
    const bySource = periodSessions.reduce((acc, s) => {
      acc[s.source] = (acc[s.source] || 0) + s.durationMin
      return acc
    }, {} as Record<string, number>)
    
    // Course breakdown (top 5)
    const byCourse = periodSessions.reduce((acc, s) => {
      if (s.courseId) {
        acc[s.courseId] = (acc[s.courseId] || 0) + s.durationMin
      }
      return acc
    }, {} as Record<string, number>)
    
    // Daily trend
    const dailyData = minutesByDay(periodSessions, dateRanges[selectedPeriod].start, dateRanges[selectedPeriod].end)
      .map(d => ({
        date: d.date,
        hours: Math.round(d.minutes / 60 * 10) / 10,
        day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
      }))
    
    // Study streaks - use effective streak from gamification system
    const currentStreak = getEffectiveStreak()
    const sortedDays = dailyData.sort((a, b) => a.date.localeCompare(b.date))
    let maxStreak = 0
    let tempStreak = 0
    
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      if (sortedDays[i].hours > 0) {
        tempStreak++
      } else {
        maxStreak = Math.max(maxStreak, tempStreak)
        tempStreak = 0
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak)
    
    return {
      totalHours,
      totalMinutes,
      avgPerDay,
      sessionsCount: periodSessions.length,
      bySource: Object.entries(bySource).map(([source, minutes]) => ({
        source: source.charAt(0).toUpperCase() + source.slice(1),
        minutes,
        hours: Math.round(minutes / 60 * 10) / 10,
        percentage: Math.round(minutes / totalMinutes * 100)
      })).sort((a, b) => b.minutes - a.minutes),
      byCourse: Object.entries(byCourse).map(([courseId, minutes]) => ({
        courseId,
        minutes,
        hours: Math.round(minutes / 60 * 10) / 10,
        percentage: Math.round(minutes / totalMinutes * 100)
      })).sort((a, b) => b.minutes - a.minutes).slice(0, 5),
      dailyData,
      currentStreak,
      maxStreak
    }
  }, [periodSessions, dateRanges, selectedPeriod, getEffectiveStreak])

  // Study patterns analysis
  const patterns = useMemo(() => {
    const hourCounts = new Array(24).fill(0)
    const dayOfWeekCounts = new Array(7).fill(0) // Sunday = 0
    
    periodSessions.forEach(session => {
      const start = new Date(session.start)
      const hour = start.getHours()
      const dayOfWeek = start.getDay()
      
      hourCounts[hour] += session.durationMin
      dayOfWeekCounts[dayOfWeek] += session.durationMin
    })
    
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts))
    const peakDay = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts))
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    return {
      peakHour: peakHour === 0 ? '12:00 AM' : peakHour < 12 ? `${peakHour}:00 AM` : peakHour === 12 ? '12:00 PM' : `${peakHour - 12}:00 PM`,
      peakDay: dayNames[peakDay],
      hourlyData: hourCounts.map((minutes, hour) => ({
        hour: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
        minutes: Math.round(minutes),
        hours: Math.round(minutes / 60 * 10) / 10
      })),
      weeklyData: dayOfWeekCounts.map((minutes, day) => ({
        day: dayNames[day].slice(0, 3),
        fullDay: dayNames[day],
        minutes: Math.round(minutes),
        hours: Math.round(minutes / 60 * 10) / 10
      }))
    }
  }, [periodSessions])

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
          className="bg-gradient-to-br from-white to-slate-50/90 dark:from-neutral-900 dark:to-neutral-800/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 dark:border-neutral-700/30 w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200/50 dark:border-neutral-700/50 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-indigo-900/20 dark:to-purple-900/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Study Hours Analytics
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 font-medium">Detailed insights into your study patterns</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onClose} 
              className="rounded-2xl border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Period Selector */}
            <div className="flex gap-3 mb-6">
              {(['week', 'month', 'term'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod(period)}
                  className={`rounded-2xl px-6 py-2 font-semibold transition-all duration-200 ${
                    selectedPeriod === period 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
                      : 'border-neutral-200 dark:border-neutral-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-950 dark:hover:to-purple-950'
                  }`}
                >
                  {dateRanges[period].label}
                </Button>
              ))}
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="rounded-2xl border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-900/30 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Total Hours</p>
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{analytics.totalHours}h</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/30 dark:to-teal-900/30 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Daily Average</p>
                      <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{analytics.avgPerDay}m</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950/30 dark:to-violet-900/30 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">Sessions</p>
                      <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{analytics.sessionsCount}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/30 dark:to-amber-900/30 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">Current Streak</p>
                      <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{analytics.currentStreak} days</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for detailed analytics */}
            <Tabs defaultValue="trends" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/80 p-1 backdrop-blur-sm">
                <TabsTrigger 
                  value="trends" 
                  className="rounded-xl bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-neutral-700 font-semibold transition-all duration-200"
                >
                  Daily Trends
                </TabsTrigger>
                <TabsTrigger 
                  value="patterns" 
                  className="rounded-xl bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-neutral-700 font-semibold transition-all duration-200"
                >
                  Study Patterns
                </TabsTrigger>
                <TabsTrigger 
                  value="sources" 
                  className="rounded-xl bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-neutral-700 font-semibold transition-all duration-200"
                >
                  Sources
                </TabsTrigger>
                <TabsTrigger 
                  value="courses" 
                  className="rounded-xl bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-neutral-700 font-semibold transition-all duration-200"
                >
                  Courses
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trends" className="space-y-6">
                <Card className="rounded-2xl border-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      Daily Study Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.dailyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="day" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip 
                            formatter={(value: number) => [`${value}h`, 'Hours']}
                            labelFormatter={(label) => `Day: ${label}`}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Bar 
                            dataKey="hours" 
                            fill="url(#colorGradient)" 
                            radius={[6, 6, 0, 0]} 
                          />
                          <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0.6}/>
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="patterns" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="rounded-2xl border-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        Peak Study Times
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                          <span className="font-semibold text-indigo-700 dark:text-indigo-300">Peak Hour</span>
                          <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 px-3 py-1">
                            {patterns.peakHour}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">Peak Day</span>
                          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 px-3 py-1">
                            {patterns.peakDay}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-2xl border border-orange-100 dark:border-orange-800">
                          <span className="font-semibold text-orange-700 dark:text-orange-300">Max Streak</span>
                          <Badge className="bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0 px-3 py-1">
                            {analytics.maxStreak} days
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
                          <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        Weekly Pattern
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={patterns.weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="day" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip 
                              formatter={(value: number) => [`${value}h`, 'Hours']}
                              labelFormatter={(label) => `${label}`}
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Bar 
                              dataKey="hours" 
                              fill="url(#weeklyGradient)" 
                              radius={[6, 6, 0, 0]} 
                            />
                            <defs>
                              <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={COLORS[2]} stopOpacity={0.6}/>
                              </linearGradient>
                            </defs>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="sources" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="rounded-2xl border-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                          <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        Study Sources Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.bySource.map((source, index) => (
                          <div key={source.source} className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800/80 dark:to-neutral-700/80 rounded-2xl border border-neutral-200/50 dark:border-neutral-600/50 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center gap-4">
                              <div 
                                className="w-4 h-4 rounded-full shadow-sm" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="font-semibold text-neutral-700 dark:text-neutral-200">{source.source}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-neutral-800 dark:text-neutral-100">{source.hours}h</p>
                              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{source.percentage}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        Source Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.bySource}
                              dataKey="hours"
                              nameKey="source"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ percentage }) => `${percentage}%`}
                              labelLine={false}
                            >
                              {analytics.bySource.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => [`${value}h`, 'Hours']}
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="courses" className="space-y-6">
                <Card className="rounded-2xl border-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      Top Courses by Study Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.byCourse.length > 0 ? (
                      <div className="space-y-4">
                        {analytics.byCourse.map((course, index) => (
                          <div key={course.courseId} className="flex items-center justify-between p-5 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800/80 dark:to-neutral-700/80 rounded-2xl border border-neutral-200/50 dark:border-neutral-600/50 hover:shadow-lg transition-all duration-200">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                                {index + 1}
                              </div>
                              <span className="font-semibold text-lg text-neutral-700 dark:text-neutral-200">{course.courseId}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-xl text-neutral-800 dark:text-neutral-100">{course.hours}h</p>
                              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{course.percentage}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
                        </div>
                        <p className="text-lg font-semibold text-neutral-600 dark:text-neutral-300 mb-2">No course-specific study sessions found</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Study sessions linked to courses will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
