import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CalendarCheck, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useAttendance, type ClassAttendance } from '@/store/attendanceStore'
import { useGamification } from '@/store/gamificationStore'
import { useTheme } from '@/store/theme'
import { useSchedule, type Slot, type DayIndex } from '@/store/scheduleStore'

/** CSS-only scrollbar skins (light/dark) for horizontal term scrollers. */
const scrollbarStyles = `
  .light-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
  .light-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 5px; }
  .light-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.20); border-radius: 5px; }
  .light-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.30); }

  .dark-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
  .dark-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.10); border-radius: 5px; }
  .dark-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.20); border-radius: 5px; }
  .dark-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.30); }
`;

export const AttendanceWidget: React.FC = () => {
  const { 
    markAttendance,
    getLast365DaysData,
    getWeeklyAttendanceRate,
    getMonthlyAttendanceRate,
    getSemesterAttendanceRate,
    getPerfectAttendanceDays,
    getTotalAttendanceDays,
    hasUnmarkedClasses,
    getTodaysPendingClasses,
    getAttendanceForDate,
    addAttendanceRecord
  } = useAttendance()
  
  const gamification = useGamification()
  const theme = useTheme()
  
  // Schedule store hooks
  const { years, selectedYearId, getActiveTermForDate } = useSchedule()
  
  const [showDialog, setShowDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedRecord, setSelectedRecord] = useState<ClassAttendance[]>([])

  // Get active year and term
  const activeYear = useMemo(() => {
    const yid = selectedYearId || years[0]?.id;
    return years.find((y) => y.id === yid);
  }, [years, selectedYearId]);

  const activeTerm = useMemo(() => {
    const today = new Date();
    const activeByDate = getActiveTermForDate(today);
    return activeByDate?.term || activeYear?.terms?.[0];
  }, [activeYear, getActiveTermForDate]);

  // Helper function to get day of week from date string
  const getDayOfWeek = (dateString: string): DayIndex => {
    return new Date(dateString).getDay() as DayIndex;
  };

  // Helper function to generate classes for a specific date
  const generateClassesForDate = useMemo(() => {
    return (dateString: string): ClassAttendance[] => {
      if (!activeTerm) return [];
      
      const dayOfWeek = getDayOfWeek(dateString);
      const slotsForDay = activeTerm.slots.filter((slot: Slot) => slot.day === dayOfWeek);
      
      return slotsForDay.map((slot: Slot) => ({
        date: dateString,
        slotId: slot.id,
        courseCode: slot.courseCode || '',
        courseName: slot.title || slot.courseCode || 'Class',
        attended: false,
        marked: false,
        time: slot.start,
        room: slot.room
      }));
    };
  }, [activeTerm]);

  // Function to ensure attendance records exist for the term range
  const ensureAttendanceRecords = useMemo(() => {
    return () => {
      if (!activeTerm?.startDate || !activeTerm?.endDate) return;

      const startDate = new Date(activeTerm.startDate);
      const endDate = new Date(activeTerm.endDate);
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        const existingRecord = getAttendanceForDate(dateString);
        
        if (!existingRecord) {
          const classesForDay = generateClassesForDate(dateString);
          if (classesForDay.length > 0) {
            addAttendanceRecord(dateString, classesForDay);
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    };
  }, [activeTerm?.startDate, activeTerm?.endDate, getAttendanceForDate, addAttendanceRecord, generateClassesForDate]);

  // Initialize attendance records when component mounts or term changes
  useEffect(() => {
    ensureAttendanceRecords();
  }, [ensureAttendanceRecords]);

  // Inject scrollbar styles and determine theme
  useEffect(() => {
    let styleElement = document.getElementById('aq-attendance-scrollbar-styles') as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'aq-attendance-scrollbar-styles';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = scrollbarStyles;
  }, []);

  // Get scrollbar class based on theme
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme.mode === 'dark' || (theme.mode === 'system' && systemDark);
  const scrollbarClass = isDark ? 'dark-scrollbar' : 'light-scrollbar';

  // Generate attendance data for the last 365 days (GitHub-style)
  const contributionData = useMemo(() => {
    const data = getLast365DaysData()
    
    // Group by weeks for the grid
    const weeks: Array<Array<{ date: string; attendanceRate: number; totalClasses: number }>> = []
    let currentWeek: Array<{ date: string; attendanceRate: number; totalClasses: number }> = []
    
    data.forEach((day, index) => {
      const dayOfWeek = new Date(day.date).getDay()
      
      if (index === 0) {
        // Fill empty days at the beginning of first week
        for (let i = 0; i < dayOfWeek; i++) {
          currentWeek.push({ date: '', attendanceRate: 0, totalClasses: 0 })
        }
      }
      
      currentWeek.push(day)
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    })
    
    // Add remaining days to last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', attendanceRate: 0, totalClasses: 0 })
      }
      weeks.push(currentWeek)
    }
    
    return weeks
  }, [getLast365DaysData])

  // Generate month labels for the contribution graph
  const monthLabels = useMemo(() => {
    const labels: Array<{ label: string; weekIndex: number }> = []
    const now = new Date()
    
    // Go back 12 months and find the first week of each month
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' })
      
      // Find which week this month starts in
      const daysSinceStart = Math.floor((now.getTime() - monthDate.getTime()) / (1000 * 60 * 60 * 24))
      const weeksFromEnd = Math.floor(daysSinceStart / 7)
      const weekIndex = Math.max(0, contributionData.length - weeksFromEnd - 1)
      
      // Only add if we don't already have a label too close
      if (!labels.some(l => Math.abs(l.weekIndex - weekIndex) < 4)) {
        labels.push({ label: monthName, weekIndex })
      }
    }
    
    return labels
  }, [contributionData])

  // Get color intensity based on attendance rate
  const getIntensityColor = (rate: number, totalClasses: number) => {
    if (totalClasses === 0) return 'bg-neutral-100 dark:bg-neutral-800'
    if (rate >= 95) return 'bg-green-600 dark:bg-green-500'
    if (rate >= 80) return 'bg-green-400 dark:bg-green-400'
    if (rate >= 60) return 'bg-green-300 dark:bg-green-300'
    if (rate >= 40) return 'bg-yellow-300 dark:bg-yellow-400'
    return 'bg-red-300 dark:bg-red-400'
  }

  // Statistics - Use effective streak from gamification system
  const currentStreak = gamification.getEffectiveAttendanceStreak()
  const weeklyRate = getWeeklyAttendanceRate()
  const monthlyRate = getMonthlyAttendanceRate()
  const semesterRate = getSemesterAttendanceRate()
  const perfectDays = getPerfectAttendanceDays()
  const totalDays = getTotalAttendanceDays()

  const handleDayClick = (date: string) => {
    if (!date) return
    setSelectedDate(date)
    
    // Get attendance record for this date, or create one if it doesn't exist
    let record = getAttendanceForDate(date)
    
    if (!record) {
      // Generate classes from schedule for this date
      const classesForDay = generateClassesForDate(date)
      if (classesForDay.length > 0) {
        addAttendanceRecord(date, classesForDay)
        record = getAttendanceForDate(date)
      }
    }
    
    setSelectedRecord(record?.classes || [])
    setShowDialog(true)
  }

  const markClassAttendance = async (date: string, slotId: string, attended: boolean) => {
    await markAttendance(date, slotId, attended)
    
    // Update gamification
    if (attended) {
      gamification.addXP(10) // Reward attendance
    }
    
    // Refresh selected record
    const record = getAttendanceForDate(date)
    setSelectedRecord(record?.classes || [])
    
    // Check for achievements
    gamification.checkAchievements()
  }

  // Check for pending classes today
  const pendingToday = getTodaysPendingClasses()
  const today = new Date().toISOString().split('T')[0]
  const hasUnmarkedToday = hasUnmarkedClasses(today)

  return (
    <Card className="border-0 shadow-lg rounded-3xl bg-white/80 dark:bg-neutral-900/60">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5" />
            <div>
              <h3 className="text-lg font-semibold">Class Attendance</h3>
              {activeTerm && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {activeYear?.label} • {activeTerm.name}
                  {activeTerm.startDate && activeTerm.endDate && (
                    <span className="ml-2">
                      ({new Date(activeTerm.startDate).toLocaleDateString()} - {new Date(activeTerm.endDate).toLocaleDateString()})
                    </span>
                  )}
                </p>
              )}
            </div>
            {hasUnmarkedToday && (
              <Badge variant="destructive" className="ml-2">
                <AlertCircle className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Current Streak</p>
            <p className="text-xl font-bold text-green-600">{currentStreak} days</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
              <p className="text-lg font-bold text-blue-600">{Math.round(weeklyRate)}%</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">This Week</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
              <p className="text-lg font-bold text-green-600">{Math.round(monthlyRate)}%</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">This Month</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
              <p className="text-lg font-bold text-purple-600">{Math.round(semesterRate)}%</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Semester</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
              <p className="text-lg font-bold text-orange-600">{perfectDays}/{totalDays}</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Perfect Days</p>
            </div>
          </div>

          {/* Contribution Graph */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {contributionData.reduce((acc, week) => acc + week.filter(d => d.totalClasses > 0).length, 0)} 
                  {' '}class days in the last year
                </p>
                {activeTerm && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Showing schedule from {activeTerm.name} 
                    {activeTerm.startDate && activeTerm.endDate && (
                      <span> ({new Date(activeTerm.startDate).toLocaleDateString()} - {new Date(activeTerm.endDate).toLocaleDateString()})</span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>Absent</span>
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-neutral-100 dark:bg-neutral-800" title="No classes"></div>
                  <div className="w-2.5 h-2.5 rounded-sm bg-red-300 dark:bg-red-400" title="Poor attendance"></div>
                  <div className="w-2.5 h-2.5 rounded-sm bg-yellow-300 dark:bg-yellow-400" title="Moderate attendance"></div>
                  <div className="w-2.5 h-2.5 rounded-sm bg-green-400 dark:bg-green-400" title="Good attendance"></div>
                  <div className="w-2.5 h-2.5 rounded-sm bg-green-600 dark:bg-green-500" title="Excellent attendance"></div>
                </div>
                <span>Present</span>
              </div>
            </div>
            
            {/* Month Labels */}
            <div className="relative mb-1">
              <div className="flex gap-1">
                {contributionData.map((_, weekIndex) => (
                  <div key={weekIndex} className="w-3 h-4 flex items-end justify-center">
                    {monthLabels.map(month => 
                      month.weekIndex === weekIndex ? (
                        <span 
                          key={month.label}
                          className="text-xs text-neutral-500 dark:text-neutral-400 font-medium"
                        >
                          {month.label}
                        </span>
                      ) : null
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className={`flex gap-1 overflow-x-auto pb-2 ${scrollbarClass}`}>
              {contributionData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <motion.div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-400 hover:scale-125 ${
                        day.date ? getIntensityColor(day.attendanceRate, day.totalClasses) : 'bg-transparent'
                      }`}
                      onClick={() => handleDayClick(day.date)}
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 1.1 }}
                      title={day.date ? 
                        `${day.date}: ${day.attendanceRate}% attendance (${day.totalClasses} classes)` : 
                        ''
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Pending Classes Alert */}
          {pendingToday.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Pending Attendance ({pendingToday.length} classes)
                </p>
              </div>
              <div className="space-y-2">
                {pendingToday.slice(0, 3).map((classRecord, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-yellow-700 dark:text-yellow-300">
                      {classRecord.time} - {classRecord.courseName}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => markClassAttendance(today, classRecord.slotId, true)}
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => markClassAttendance(today, classRecord.slotId, false)}
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingToday.length > 3 && (
                  <p className="text-xs text-yellow-600">
                    +{pendingToday.length - 3} more classes pending
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>

      {/* Attendance Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 
                                  dark:from-neutral-900/95 dark:via-neutral-900/90 dark:to-neutral-800/85 backdrop-blur-md
                                  ring-1 ring-white/20 dark:ring-white/10">
          <DialogHeader className="pb-4 border-b border-gray-200/30 dark:border-gray-700/30">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 
                                  dark:from-blue-400 dark:via-purple-400 dark:to-blue-300 bg-clip-text text-transparent
                                  flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 
                            border border-blue-100/50 dark:border-blue-800/30 shadow-lg">
                <CalendarCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Attendance for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </DialogTitle>
          </DialogHeader>
          
          <div className={`space-y-4 max-h-96 overflow-y-auto ${scrollbarClass}`}>
            {selectedRecord.length > 0 ? (
              selectedRecord.map((classRecord, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-white/80 to-gray-50/60 dark:from-gray-800/80 dark:to-gray-900/60 
                           border border-gray-200/50 dark:border-gray-700/30 shadow-lg backdrop-blur-sm
                           hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-2">
                        {classRecord.courseName}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/30 
                                       border border-blue-100/50 dark:border-blue-800/30">
                          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium">{classRecord.time}</span>
                        </span>
                        {classRecord.room && (
                          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50/80 dark:bg-emerald-950/30 
                                         border border-emerald-100/50 dark:border-emerald-800/30">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-medium">{classRecord.room}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Badge 
                        variant={
                          classRecord.marked ? 
                            (classRecord.attended ? 'default' : 'destructive') : 
                            'outline'
                        }
                        className={`px-3 py-1 font-medium text-sm shadow-lg ${
                          classRecord.marked 
                            ? classRecord.attended 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-green-200/50' 
                              : 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-red-200/50'
                            : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {classRecord.marked ? (
                          classRecord.attended ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Present
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Absent
                            </span>
                          )
                        ) : (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </Badge>
                    </div>
                  </div>
                  
                  {!classRecord.marked && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex gap-3 pt-3 border-t border-gray-200/30 dark:border-gray-700/30"
                    >
                      <Button
                        size="sm"
                        className="flex-1 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700
                                 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600
                                 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                                 hover:scale-105 active:scale-95 font-medium"
                        onClick={() => markClassAttendance(selectedDate, classRecord.slotId, true)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Present
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700
                                 dark:from-red-500 dark:to-rose-500 dark:hover:from-red-600 dark:hover:to-rose-600
                                 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                                 hover:scale-105 active:scale-95 font-medium"
                        onClick={() => markClassAttendance(selectedDate, classRecord.slotId, false)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Mark Absent
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 px-6"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/60 
                              dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-100/50 dark:border-blue-800/30 
                              flex items-center justify-center shadow-lg">
                  <CalendarCheck className="w-10 h-10 text-blue-400 dark:text-blue-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  No Classes Scheduled
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  There are no classes scheduled for this day. Enjoy your free time!
                </p>
              </motion.div>
            )}
          </div>
          
          <DialogFooter className="pt-6 border-t border-gray-200/30 dark:border-gray-700/30 mt-4">
            <Button 
              variant="outline" 
              className="rounded-2xl border-2 bg-gradient-to-r from-white/90 to-gray-50/80 dark:from-gray-800/90 dark:to-gray-900/80 
                       backdrop-blur-md hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 
                       border-gray-200/60 dark:border-gray-600/40 hover:border-blue-200/60 dark:hover:border-blue-400/30
                       shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95
                       text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300
                       font-medium tracking-wide px-6 py-2" 
              onClick={() => setShowDialog(false)}
            >
              <span className="relative z-10">Close</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
