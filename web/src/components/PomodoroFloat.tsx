import React from 'react'
import { useTheme, PALETTES } from '@/store/theme'
import { useSettings } from '@/store/settingsStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAcademicPlan } from '@/store/academicPlanStore'
import { useStudySessions } from '@/store/studySessionsStore'
import { Play, Pause, X, Check, GripVertical, Timer } from 'lucide-react'

type Corner = 'tl' | 'tr' | 'bl' | 'br'

function useCornerPosition() {
  const settings = useSettings()
  const [corner, setCorner] = React.useState<Corner>(() => {
    // If position is set to static, use that corner; otherwise use saved corner or default
    if (settings.pomodoroPosition !== 'draggable') {
      return settings.pomodoroPosition as Corner
    }
    return (localStorage.getItem('aq:pomo-corner') as Corner) || 'br'
  })
  
  React.useEffect(() => { 
    if (settings.pomodoroPosition === 'draggable') {
      localStorage.setItem('aq:pomo-corner', corner)
    }
  }, [corner, settings.pomodoroPosition])

  // Update corner when settings change
  React.useEffect(() => {
    if (settings.pomodoroPosition !== 'draggable') {
      setCorner(settings.pomodoroPosition as Corner)
    }
  }, [settings.pomodoroPosition])
  
  // Listen for storage events and custom events to sync across components
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aq:pomo-corner' && e.newValue && settings.pomodoroPosition === 'draggable') {
        setCorner(e.newValue as Corner)
      }
    }
    
    const handleCustomShow = (e: CustomEvent) => {
      if (e.detail?.corner && settings.pomodoroPosition === 'draggable') {
        setCorner(e.detail.corner as Corner)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('pomo-show', handleCustomShow as EventListener)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('pomo-show', handleCustomShow as EventListener)
    }
  }, [settings.pomodoroPosition])
  
  const style: React.CSSProperties = React.useMemo(() => {
    const base: React.CSSProperties = { position: 'fixed', zIndex: 50 }
    switch (corner) {
      case 'tl': return { ...base, top: 16, left: 16 }
      case 'tr': return { ...base, top: 16, right: 16 }
      case 'bl': return { ...base, bottom: 16, left: 16 }
      case 'br': return { ...base, bottom: 16, right: 16 }
    }
  }, [corner])
  return { corner, setCorner, style }
}

export default function PomodoroFloat() {
  const theme = useTheme()
  const settings = useSettings()
  const COLORS = PALETTES[theme.palette]
  const { setCorner, style } = useCornerPosition()
  const addSession = useStudySessions((s) => s.add)
  const years = useAcademicPlan((s) => s.years)
  const selectedYearId = useAcademicPlan((s) => s.selectedYearId)

  // Timer state with persistence
  const [running, setRunning] = React.useState<boolean>(() => localStorage.getItem('aq:pomo-running') === 'true')
  const [secondsLeft, setSecondsLeft] = React.useState<number>(() => {
    const saved = localStorage.getItem('aq:pomo-seconds')
    return saved ? Number(saved) : 25 * 60
  })
  const [sessionStartTime, setSessionStartTime] = React.useState<string | null>(() => localStorage.getItem('aq:pomo-start'))
  const [workMin, setWorkMin] = React.useState<number>(() => Number(localStorage.getItem('aq:pomo-work')) || 25)
  const [shortMin, setShortMin] = React.useState<number>(() => Number(localStorage.getItem('aq:pomo-short')) || 5)
  const [longMin, setLongMin] = React.useState<number>(() => Number(localStorage.getItem('aq:pomo-long')) || 15)
  const [panelOpen, setPanelOpen] = React.useState(false)
  const [logOpen, setLogOpen] = React.useState(false)
  const [expandedManual, setExpandedManual] = React.useState(false)

  React.useEffect(() => { localStorage.setItem('aq:pomo-work', String(workMin)) }, [workMin])
  React.useEffect(() => { localStorage.setItem('aq:pomo-short', String(shortMin)) }, [shortMin])
  React.useEffect(() => { localStorage.setItem('aq:pomo-long', String(longMin)) }, [longMin])
  React.useEffect(() => { localStorage.setItem('aq:pomo-running', String(running)) }, [running])
  React.useEffect(() => { localStorage.setItem('aq:pomo-seconds', String(secondsLeft)) }, [secondsLeft])
  React.useEffect(() => { 
    if (sessionStartTime) {
      localStorage.setItem('aq:pomo-start', sessionStartTime)
    } else {
      localStorage.removeItem('aq:pomo-start')
    }
  }, [sessionStartTime])

  const completeSession = React.useCallback((start: Date, end: Date) => {
    const yid = selectedYearId || years[0]?.id
    const tid = years.find(y => y.id === yid)?.terms?.[0]?.id
    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000)
    
    addSession({
      id: crypto.randomUUID(),
      yearId: yid,
      termId: tid,
      courseId: undefined,
      source: 'pomodoro',
      start: start.toISOString(),
      end: end.toISOString(),
      durationMin: Math.max(1, durationMin),
      note: 'Pomodoro session',
    })
    
    // Clear session data
    setSessionStartTime(null)
    localStorage.removeItem('aq:pomo-start')
  }, [selectedYearId, years, addSession])

  // Restore timer on page load if it was running
  React.useEffect(() => {
    const savedStart = localStorage.getItem('aq:pomo-start')
    const savedRunning = localStorage.getItem('aq:pomo-running') === 'true'
    
    if (savedRunning && savedStart) {
      const startTime = new Date(savedStart)
      const now = new Date()
      const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)
      const savedSeconds = Number(localStorage.getItem('aq:pomo-seconds')) || workMin * 60
      const remainingSeconds = Math.max(0, savedSeconds - elapsedSeconds)
      
      if (remainingSeconds > 0) {
        setSecondsLeft(remainingSeconds)
        setRunning(true)
      } else {
        // Timer finished while away, complete the session
        setRunning(false)
        setSecondsLeft(0)
        completeSession(startTime, now)
      }
    }
  }, [workMin, completeSession]) // Run once on mount

  // Tick
  React.useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running])

  // Auto-handle session end
  React.useEffect(() => {
    if (!running || secondsLeft > 0) return
    setRunning(false)
    
    // Get actual start time if available, otherwise estimate
    const savedStart = sessionStartTime || localStorage.getItem('aq:pomo-start')
    const now = new Date()
    const start = savedStart ? new Date(savedStart) : new Date(now.getTime() - workMin * 60 * 1000)
    
    completeSession(start, now)
  }, [running, secondsLeft, sessionStartTime, workMin, completeSession])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60

  // Corner snapping drag
  const dragRef = React.useRef<HTMLDivElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const [dropBounce, setDropBounce] = React.useState(false)
  
  React.useEffect(() => {
    const gripEl = dragRef.current
    const containerEl = containerRef.current
    
    // Only enable dragging if position is set to draggable
    if (!gripEl || !containerEl || settings.pomodoroPosition !== 'draggable') return
    
    let startX = 0, startY = 0
    let sx = 0, sy = 0
    let isDragActive = false
    
    const onDown = (e: MouseEvent) => {
      isDragActive = true
      setDragging(true)
      const r = containerEl.getBoundingClientRect()
      sx = r.left; sy = r.top
      startX = e.clientX; startY = e.clientY
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      e.preventDefault()
      e.stopPropagation()
    }
    
    const onMove = (e: MouseEvent) => {
      if (!isDragActive || !containerEl) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      
      // Ensure the element stays visible
      containerEl.style.visibility = 'visible'
      containerEl.style.display = 'block'
      containerEl.style.transition = 'none'
      containerEl.style.left = `${sx + dx}px`
      containerEl.style.top = `${sy + dy}px`
      containerEl.style.right = 'auto'
      containerEl.style.bottom = 'auto'
    }
    
    const onUp = () => {
      if (!isDragActive || !containerEl) return
      isDragActive = false
      setDragging(false)
      
      // Snap to nearest corner
      const vw = window.innerWidth
      const vh = window.innerHeight
      const r = containerEl.getBoundingClientRect()
      const corners: Array<{ c: Corner; x: number; y: number }> = [
        { c: 'tl', x: 16, y: 16 },
        { c: 'tr', x: vw - r.width - 16, y: 16 },
        { c: 'bl', x: 16, y: vh - r.height - 16 },
        { c: 'br', x: vw - r.width - 16, y: vh - r.height - 16 },
      ]
      let best = corners[0]
      let bestDist = Infinity
      corners.forEach((k) => {
        const d = Math.hypot(r.left - k.x, r.top - k.y)
        if (d < bestDist) { best = k; bestDist = d }
      })
      
      setCorner(best.c)
      setDropBounce(true)
      setTimeout(() => setDropBounce(false), 180)
      
      // Reset to corner styles immediately and ensure visibility
      containerEl.style.transition = ''
      containerEl.style.left = ''
      containerEl.style.top = ''
      containerEl.style.right = ''
      containerEl.style.bottom = ''
      containerEl.style.visibility = 'visible'
      containerEl.style.display = 'block'
      
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    
    gripEl.addEventListener('mousedown', onDown)
    
    return () => {
      gripEl.removeEventListener('mousedown', onDown)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [setCorner, settings.pomodoroPosition])

  const pillStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.70))',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 24,
    padding: '8px 10px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
    backdropFilter: 'blur(8px)',
  }
  const pillStyleDark: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(28,28,28,0.85), rgba(22,22,22,0.60))',
    border: '1px solid rgba(255,255,255,0.08)',
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme.mode === 'dark' || (theme.mode === 'system' && prefersDark)

  const expanded = running || expandedManual
  
  // Auto-hide logic based on settings
  const shouldShow = !settings.pomodoroAutoHide || running || expandedManual
  
  // Size adjustments based on settings
  const getSizeMultiplier = () => {
    switch (settings.pomodoroSize) {
      case 'small': return 0.8
      case 'large': return 1.2
      default: return 1.0 // medium
    }
  }
  const sizeMultiplier = getSizeMultiplier()
  
  const getWidths = () => {
    // Dynamic width calculation based on content
    const baseCollapsed = 88
    // Calculate expanded width: grip(20) + timer_icon(32) + timer_text(48) + pause_button(24) + open_button(64) + gaps(20) + padding(16)
    const baseExpanded = settings.pomodoroPosition === 'draggable' ? 224 : 204 // No grip for static
    return {
      collapsed: `${baseCollapsed * sizeMultiplier}px`,
      expanded: `${baseExpanded * sizeMultiplier}px`
    }
  }
  const widths = getWidths()
  
  const containerStyle: React.CSSProperties = {
    ...style,
    transition: dragging ? 'none' : 'all 180ms cubic-bezier(.2,.8,.2,1)',
    transform: dropBounce ? 'scale(1.03)' : 'scale(1.0)',
    userSelect: 'none',
    touchAction: 'none',
    pointerEvents: 'auto',
    visibility: shouldShow ? 'visible' : 'hidden',
    display: shouldShow ? 'block' : 'none',
    opacity: shouldShow ? 1 : 0
  }

  return (
    <div ref={containerRef} style={containerStyle}>
      {/* Floating cute/minimalist pill */}
      <div
        className={`group select-none transition-all duration-200 overflow-hidden`}
        style={{ 
          ...pillStyle, 
          ...(isDark ? pillStyleDark : {}),
          width: expanded ? widths.expanded : widths.collapsed,
          transform: `scale(${sizeMultiplier})`
        }}
      >
        <div className={`flex items-center ${expanded ? 'justify-between' : 'gap-2'}`}>
          {settings.pomodoroPosition === 'draggable' && (
            <div 
              ref={dragRef}
              className="cursor-grab active:cursor-grabbing flex-shrink-0"
              style={{ cursor: dragging ? 'grabbing' : 'grab' }}
            >
              <GripVertical className="h-3.5 w-3.5 opacity-60" />
            </div>
          )}
          <button
            className="h-8 w-8 rounded-xl focus:outline-none flex-shrink-0 cursor-pointer"
            title="Pomodoro"
            onClick={() => setExpandedManual((v) => !v)}
            style={{ 
              background: `linear-gradient(135deg, ${COLORS[0]}dd, ${COLORS[3]}dd)`,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: `${14 * sizeMultiplier}px`,
              fontWeight: 'bold'
            }}
          >
            ⏱️
          </button>
          {expanded && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div 
                className="font-semibold tabular-nums text-center" 
                style={{ 
                  minWidth: `${48 * sizeMultiplier}px`,
                  fontSize: `${14 * sizeMultiplier}px`
                }}
              >
                {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
              </div>
              {/* Pause/Resume button - only show when timer has been started */}
              {(running || secondsLeft < workMin * 60) && (
                <button
                  className="rounded-xl focus:outline-none flex-shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => setRunning(!running)}
                  style={{ 
                    width: `${24 * sizeMultiplier}px`,
                    height: `${24 * sizeMultiplier}px`,
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? COLORS[1] : COLORS[3],
                    padding: 0
                  }}
                  title={running ? 'Pause' : 'Resume'}
                >
                  {running ? 
                    <Pause style={{ width: `${14 * sizeMultiplier}px`, height: `${14 * sizeMultiplier}px` }} /> : 
                    <Play style={{ width: `${14 * sizeMultiplier}px`, height: `${14 * sizeMultiplier}px` }} />
                  }
                </button>
              )}
              <Button 
                size="sm" 
                className="rounded-xl px-3" 
                style={{ 
                  height: `${32 * sizeMultiplier}px`,
                  fontSize: `${12 * sizeMultiplier}px`
                }}
                variant="outline" 
                onClick={() => { setPanelOpen(true) }}
              >
                {running ? 'Running' : 'Open'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Panel */}
      <Dialog open={panelOpen} onOpenChange={setPanelOpen}>
        <DialogContent className="max-w-lg border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-white to-slate-50/90 dark:from-neutral-900 dark:to-neutral-800/90 backdrop-blur-lg">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
                <Timer size={18} className="text-white" />
              </div>
              Pomodoro Timer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 px-2">
            <div className="text-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800/50 dark:to-neutral-700/50 rounded-3xl p-6 border border-neutral-200/50 dark:border-neutral-600/50">
              <div className="text-7xl font-extrabold tabular-nums mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button 
                  className="rounded-2xl border-0 px-4 py-2.5 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm" 
                  style={{ 
                    background: 'linear-gradient(135deg, #059669, #0891b2)',
                    color: 'white'
                  }}
                  onClick={() => { 
                    setSecondsLeft(workMin*60); 
                    setRunning(true);
                    setSessionStartTime(new Date().toISOString());
                  }}
                ><Play className="h-3.5 w-3.5 mr-1.5" />Start Work</Button>
                <Button 
                  className="rounded-2xl px-4 py-2.5 font-semibold shadow-md hover:shadow-lg transition-all duration-200 text-sm" 
                  variant="outline" 
                  style={{ 
                    borderColor: '#e5e7eb',
                    color: '#6b7280',
                    background: 'rgba(255,255,255,0.8)'
                  }}
                  onClick={() => setRunning(false)}
                ><Pause className="h-3.5 w-3.5 mr-1.5" />Pause</Button>
                <Button 
                  className="rounded-2xl px-4 py-2.5 font-semibold shadow-md hover:shadow-lg transition-all duration-200 text-sm" 
                  variant="outline" 
                  style={{ 
                    borderColor: '#e5e7eb',
                    color: '#6b7280',
                    background: 'rgba(255,255,255,0.8)'
                  }}
                  onClick={() => {
                    setSecondsLeft(workMin*60);
                    setRunning(false);
                    setSessionStartTime(null);
                  }}
                ><X className="h-3.5 w-3.5 mr-1.5" />Reset</Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Work (min)</div>
                <Input 
                  type="number" 
                  min={1} 
                  value={workMin} 
                  onChange={(e)=>setWorkMin(Math.max(1, Number(e.target.value)||0))} 
                  className="rounded-xl border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 focus:ring-indigo-500 text-sm h-10"
                />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Short Break</div>
                <Input 
                  type="number" 
                  min={1} 
                  value={shortMin} 
                  onChange={(e)=>setShortMin(Math.max(1, Number(e.target.value)||0))} 
                  className="rounded-xl border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 focus:ring-indigo-500 text-sm h-10"
                />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Long Break</div>
                <Input 
                  type="number" 
                  min={1} 
                  value={longMin} 
                  onChange={(e)=>setLongMin(Math.max(1, Number(e.target.value)||0))} 
                  className="rounded-xl border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 focus:ring-indigo-500 text-sm h-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                className="rounded-2xl px-3 py-2 font-semibold flex-1 shadow-md hover:shadow-lg transition-all duration-200 text-sm" 
                variant="outline" 
                style={{ 
                  borderColor: '#0891b2',
                  color: '#0891b2',
                  background: 'rgba(8, 145, 178, 0.1)'
                }}
                onClick={() => setSecondsLeft(shortMin*60)}
              >Short Break</Button>
              <Button 
                className="rounded-2xl px-3 py-2 font-semibold flex-1 shadow-md hover:shadow-lg transition-all duration-200 text-sm" 
                variant="outline" 
                style={{ 
                  borderColor: '#7c3aed',
                  color: '#7c3aed',
                  background: 'rgba(124, 58, 237, 0.1)'
                }}
                onClick={() => setSecondsLeft(longMin*60)}
              >Long Break</Button>
            </div>
            <div className="border-t border-neutral-200/50 dark:border-neutral-700/50 pt-4">
              <Button 
                className="rounded-2xl px-4 py-2 font-semibold w-full shadow-md hover:shadow-lg transition-all duration-200 text-sm" 
                variant="outline" 
                style={{ 
                  borderColor: '#e5e7eb',
                  color: '#6b7280',
                  background: 'rgba(255,255,255,0.8)'
                }}
                onClick={() => setLogOpen(true)}
              >Log Study Session</Button>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button 
              className="rounded-2xl px-6 py-2 font-semibold shadow-md hover:shadow-lg transition-all duration-200 text-sm" 
              variant="outline" 
              style={{ 
                borderColor: '#e5e7eb',
                color: '#6b7280',
                background: 'rgba(255,255,255,0.8)'
              }}
              onClick={() => setPanelOpen(false)}
            >Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Log */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-w-lg border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-white to-slate-50/90 dark:from-neutral-900 dark:to-neutral-800/90 backdrop-blur-lg">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
                <Check size={18} className="text-white" />
              </div>
              Log Study Session
            </DialogTitle>
          </DialogHeader>
          <LogForm onClose={()=>setLogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LogForm({ onClose }: { onClose: () => void }) {
  const add = useStudySessions((s) => s.add)
  const years = useAcademicPlan((s) => s.years)
  const selectedYearId = useAcademicPlan((s) => s.selectedYearId)
  const yid = selectedYearId || years[0]?.id
  const year = years.find(y => y.id === yid)
  const terms = React.useMemo(() => year?.terms || [], [year?.terms])

  // Default to the first term (active term)
  const [termId, setTermId] = React.useState<string | undefined>(() => terms[0]?.id)
  const [courseId, setCourseId] = React.useState<string | undefined>(undefined)
  const [date, setDate] = React.useState<string>(() => new Date().toISOString().slice(0,10))
  const [hours, setHours] = React.useState<number>(1)
  const [note, setNote] = React.useState<string>('')

  // Update termId when terms change (e.g., when component mounts)
  React.useEffect(() => {
    if (!termId && terms.length > 0) {
      setTermId(terms[0].id)
    }
  }, [terms, termId])

  const courses = React.useMemo(() => {
    const t = terms.find(t => t.id === termId)
    return t?.courses || []
  }, [terms, termId])

  // Reset course selection when term changes
  React.useEffect(() => {
    setCourseId(undefined)
  }, [termId])

  const commit = () => {
    if (hours <= 0) return
    
    const durationMin = Math.round(hours * 60)
    const endTime = new Date(`${date}T12:00:00`)
    const startTime = new Date(endTime.getTime() - durationMin * 60000)
    
    add({
      id: crypto.randomUUID(),
      yearId: yid,
      termId: termId,
      courseId,
      source: 'manual',
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      durationMin,
      note: note || `${hours} hour${hours !== 1 ? 's' : ''} of study`,
    })
    onClose()
  }

  return (
    <div className="space-y-6 px-2">
      <div className="text-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800/50 dark:to-neutral-700/50 rounded-3xl p-6 border border-neutral-200/50 dark:border-neutral-600/50">
        <div className="text-xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Add Study Session
        </div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Record your learning progress manually
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Date</div>
          <Input 
            type="date" 
            className="rounded-xl border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 focus:ring-indigo-500 text-sm h-10" 
            value={date} 
            onChange={(e)=>setDate(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Hours Studied</div>
          <Input 
            type="number" 
            min={0.25} 
            step={0.25} 
            className="rounded-xl border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 focus:ring-indigo-500 text-sm h-10" 
            value={hours} 
            onChange={(e)=>setHours(Math.max(0.25, Number(e.target.value)||1))} 
            placeholder="e.g., 2.5"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Term</div>
          <Select value={termId} onValueChange={(v)=>setTermId(v)}>
            <SelectTrigger className="rounded-xl border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 focus:ring-indigo-500 h-10">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200 dark:border-neutral-700">
              {terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Course (optional)</div>
          <Select value={courseId || 'general'} onValueChange={(v)=>setCourseId(v === 'general' ? undefined : v)}>
            <SelectTrigger className="rounded-xl border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 focus:ring-indigo-500 h-10">
              <SelectValue placeholder="Pick course" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200 dark:border-neutral-700">
              <SelectItem value="general">General Study</SelectItem>
              {courses.map(c => {
                const displayName = c.code && c.name ? `${c.code} - ${c.name}` : (c.code || c.name || 'Course')
                return <SelectItem key={c.id} value={c.id}>{displayName}</SelectItem>
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Notes (optional)</div>
        <Input 
          placeholder="What did you study?" 
          className="rounded-xl border-neutral-200 dark:border-neutral-700 focus:border-indigo-500 focus:ring-indigo-500 text-sm h-10" 
          value={note} 
          onChange={(e)=>setNote(e.target.value)} 
        />
      </div>
      
      <DialogFooter className="gap-3 pt-4">
        <Button 
          className="rounded-2xl px-6 py-2 font-semibold shadow-md hover:shadow-lg transition-all duration-200 text-sm" 
          variant="outline" 
          style={{ 
            borderColor: '#e5e7eb',
            color: '#6b7280',
            background: 'rgba(255,255,255,0.8)'
          }}
          onClick={onClose}
        >Cancel</Button>
        <Button 
          className="rounded-2xl px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm" 
          style={{ 
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: 'white',
            border: 'none'
          }}
          onClick={commit} 
          disabled={hours <= 0}
        >
          <Check className="h-3.5 w-3.5 mr-1.5"/>
          Log {hours} Hour{hours !== 1 ? 's' : ''}
        </Button>
      </DialogFooter>
    </div>
  )
}
