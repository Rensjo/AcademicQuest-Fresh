import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Pause, Play, Snowflake, Calendar, GraduationCap } from 'lucide-react'
import { useGamification } from '@/store/gamificationStore'

interface StreakFreezePanelProps {
  isOpen: boolean
  onClose: () => void
}

export function StreakFreezePanel({ isOpen, onClose }: StreakFreezePanelProps) {
  const { 
    stats, 
    activateStreakFreeze, 
    deactivateStreakFreeze, 
    activateAttendanceStreakFreeze, 
    deactivateAttendanceStreakFreeze,
    getEffectiveStreak,
    getEffectiveAttendanceStreak
  } = useGamification()
  
  const [freezeReason, setFreezeReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const predefinedReasons = [
    { value: 'term_break', label: 'Term Break', icon: '📚' },
    { value: 'holiday', label: 'Holiday/Vacation', icon: '🏖️' },
    { value: 'no_classes', label: 'No Classes Scheduled', icon: '🚫' },
    { value: 'sick_leave', label: 'Sick Leave', icon: '🏥' },
    { value: 'family_emergency', label: 'Family Emergency', icon: '👨‍👩‍👧‍👦' },
    { value: 'travel', label: 'Travel/Study Abroad', icon: '✈️' },
    { value: 'custom', label: 'Custom Reason', icon: '✏️' }
  ]

  const handleActivateFreeze = () => {
    const reason = freezeReason === 'custom' ? customReason : 
                  predefinedReasons.find(r => r.value === freezeReason)?.label || 'Streak Freeze'
    
    activateStreakFreeze(reason, startDate || undefined, endDate || undefined)
    activateAttendanceStreakFreeze()
    
    // Reset form
    setFreezeReason('')
    setCustomReason('')
    setStartDate('')
    setEndDate('')
  }

  const handleDeactivateFreeze = () => {
    deactivateStreakFreeze()
    deactivateAttendanceStreakFreeze()
  }

  const effectiveStreak = getEffectiveStreak()
  const effectiveAttendanceStreak = getEffectiveAttendanceStreak()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <Card className="border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 
                          dark:from-neutral-900/95 dark:via-neutral-900/90 dark:to-neutral-800/85 backdrop-blur-md
                          ring-1 ring-white/20 dark:ring-white/10">
              <CardHeader className="pb-4 border-b border-gray-200/30 dark:border-gray-700/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 
                                    dark:from-blue-400 dark:via-purple-400 dark:to-blue-300 bg-clip-text text-transparent
                                    flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 
                                  border border-blue-100/50 dark:border-blue-800/30 shadow-lg">
                      <Snowflake className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    Streak Freeze Manager
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="rounded-full h-8 w-8 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Current Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50/80 to-amber-50/60 dark:from-orange-950/40 dark:to-amber-950/30 
                                border border-orange-100/50 dark:border-orange-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span className="font-medium text-orange-800 dark:text-orange-200">Study Streak</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                        {effectiveStreak} days
                      </span>
                      <Badge variant={stats.streakFreezeActive ? "secondary" : "default"}>
                        {stats.streakFreezeActive ? 'Frozen' : 'Active'}
                      </Badge>
                    </div>
                    {stats.streakFreezeActive && (
                      <p className="text-xs text-orange-600/80 dark:text-orange-400/60 mt-1">
                        Reason: {stats.streakFreezeReason}
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50/80 to-emerald-50/60 dark:from-green-950/40 dark:to-emerald-950/30 
                                border border-green-100/50 dark:border-green-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-green-800 dark:text-green-200">Attendance Streak</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {effectiveAttendanceStreak} days
                      </span>
                      <Badge variant={stats.attendanceStreakFreezeActive ? "secondary" : "default"}>
                        {stats.attendanceStreakFreezeActive ? 'Frozen' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Freeze Controls */}
                {!stats.streakFreezeActive ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                      Activate Streak Freeze
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Preserve your current streaks during breaks, holidays, or when no classes are scheduled.
                    </p>

                    {/* Reason Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="freeze-reason">Reason for Freeze</Label>
                      <Select value={freezeReason} onValueChange={setFreezeReason}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason..." />
                        </SelectTrigger>
                        <SelectContent>
                          {predefinedReasons.map((reason) => (
                            <SelectItem key={reason.value} value={reason.value}>
                              <div className="flex items-center gap-2">
                                <span>{reason.icon}</span>
                                <span>{reason.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom Reason Input */}
                    {freezeReason === 'custom' && (
                      <div className="space-y-2">
                        <Label htmlFor="custom-reason">Custom Reason</Label>
                        <Input
                          id="custom-reason"
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="Enter your custom reason..."
                        />
                      </div>
                    )}

                    {/* Date Range (Optional) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date (Optional)</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">End Date (Optional)</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleActivateFreeze}
                      disabled={!freezeReason || (freezeReason === 'custom' && !customReason)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                               text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                               hover:scale-105 active:scale-95 font-medium"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Activate Streak Freeze
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                      Streak Freeze Active
                    </h3>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 
                                  border border-blue-100/50 dark:border-blue-800/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Snowflake className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-blue-800 dark:text-blue-200">Active Freeze</span>
                      </div>
                      <p className="text-blue-700 dark:text-blue-300 mb-2">
                        <strong>Reason:</strong> {stats.streakFreezeReason}
                      </p>
                      {stats.streakFreezeStartDate && (
                        <p className="text-sm text-blue-600/80 dark:text-blue-400/60">
                          <strong>Started:</strong> {new Date(stats.streakFreezeStartDate).toLocaleDateString()}
                          {stats.streakFreezeEndDate && (
                            <span> • <strong>Ends:</strong> {new Date(stats.streakFreezeEndDate).toLocaleDateString()}</span>
                          )}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={handleDeactivateFreeze}
                      variant="outline"
                      className="w-full border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700 
                               dark:text-green-300 dark:hover:bg-green-950/20"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Deactivate Streak Freeze
                    </Button>
                  </div>
                )}

                {/* Info Section */}
                <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-neutral-50/80 to-gray-50/60 dark:from-neutral-800/40 dark:to-gray-800/30 
                              border border-neutral-200/50 dark:border-neutral-700/30">
                  <h4 className="font-medium text-neutral-800 dark:text-neutral-200 mb-2">How Streak Freeze Works</h4>
                  <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                    <li>• Preserves your current streak count during inactive periods</li>
                    <li>• Prevents streak loss during term breaks, holidays, or sick days</li>
                    <li>• Automatically applies to both study and attendance streaks</li>
                    <li>• Can be activated/deactivated manually or with date ranges</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
