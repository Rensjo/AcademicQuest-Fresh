import { useNavigate } from 'react-router-dom'
import { useTheme, PALETTES } from '@/store/theme'
import { useSchedule, type DayIndex } from "@/store/scheduleStore";
import { useSettings } from "@/store/settingsStore";
import { useAcademicPlan } from "@/store/academicPlanStore";
import { useTasksStore, isWithinNextNDays, AQTask, TaskStatus } from "@/store/tasksStore";
import { useStudySessions, minutesByDay } from "@/store/studySessionsStore";
import { useAttendance } from "@/store/attendanceStore";

import React, { useMemo, useState, useEffect } from "react";
// import { DashboardQuickTasks } from "@/pages/Tasks";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  Sparkles,
  GraduationCap,
  CalendarDays,
  ClipboardList,
  BookOpenCheck,
  Calculator,
  BookMarked,
  Settings,
  School,
  Trophy,
  Star,
  Timer,
  Wallet,
  Clock,
  MapPin,
  CalendarX,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarCheck,
  Mail,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
// removed unused Switch/Input
import { Label } from "@/components/ui/label";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  
  BarChart,
  Bar,
} from "recharts";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from "@/components/ui/select";
import { StudyHoursPanel } from "@/components/StudyHoursPanel";
import { GamificationPanel } from "@/components/GamificationPanel";
import { AttendanceWidget } from "@/components/AttendanceWidget";
import { useGamification, XP_PER_LEVEL } from "@/store/gamificationStore";

// Academic Quest — Interactive Dashboard Landing Page
// Bright, customizable, gamified, with animations.
// This file focuses ONLY on the dashboard landing; other tabs
// (Planner, Task Tracker, Schedule, Course Planner, Calculators,
// GPA, Scholarships, Textbooks, Settings) will live in separate files.
// ----------------------------------------------------------------

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

// Mock data (swap with real state later)
const mock = {
  user: { name: "Student" },
  term: "SY 2025–2026 • Term 1",
  kpis: { gpa: 1.73, units: 21, tasksDonePct: 72, streakDays: 5, level: 3, xp: 340, nextLevelXp: 500 },
  scheduleToday: [
    { time: "08:00", course: "Algorithms", room: "B402" },
    { time: "11:00", course: "Data Warehousing", room: "Lab 2" },
    { time: "15:00", course: "Operating Systems", room: "A305" },
  ],
  quickTasks: [
    { label: "Discrete HW 3", status: "In‑Progress" },
    { label: "OS Lab Report", status: "Overdue" },
    { label: "Quiz Prep: Graphs", status: "Complete" },
  ],
};

// donut data now derived from real tasks (taskDonutData)

// grade distribution will be computed from current term GPAs (0–4 scale)

//

// dynamic palette from theme store
const useColors = () => {
    const { palette } = useTheme();
    return PALETTES[palette];
};

// Enhanced color schemes for different icon categories
const getIconColorScheme = (type: 'primary' | 'academic' | 'productivity' | 'navigation' | 'feature', colors: string[]) => {
    const [c0, c1, c2, c3, c4] = colors;
    
    switch (type) {
        case 'primary':
            return {
                primary: c0,
                secondary: c3,
                glow: c1,
                accent: c2
            };
        case 'academic':
            return {
                primary: c1,
                secondary: c0,
                glow: c3,
                accent: c4
            };
        case 'productivity':
            return {
                primary: c2,
                secondary: c1,
                glow: c0,
                accent: c3
            };
        case 'navigation':
            return {
                primary: c3,
                secondary: c0,
                glow: c1,
                accent: c2
            };
        case 'feature':
            return {
                primary: c0,
                secondary: c1,
                glow: c2,
                accent: c3
            };
        default:
            return {
                primary: c0,
                secondary: c3,
                glow: c1,
                accent: c2
            };
    }
};

// Small helpers
const Chip = ({ active, onClick, color, label }: { active?: boolean; onClick?: () => void; color: string; label?: string }) => (
  <button
    onClick={onClick}
    className={`h-9 px-3 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 backdrop-blur-md
      ${active 
        ? "border-white/30 ring-2 ring-white/20 shadow-lg scale-105 shadow-black/10" 
        : "border-white/10 hover:border-white/40 hover:scale-105 hover:shadow-lg shadow-black/5"
      }`}
    style={{ 
      background: active 
        ? `linear-gradient(135deg, ${color}FF 0%, ${color}CC 50%, ${color}AA 100%)` 
        : `linear-gradient(135deg, ${color}80 0%, ${color}60 50%, ${color}40 100%)`,
      color: "#fff",
      boxShadow: active 
        ? `0 0 20px ${color}40, 0 4px 12px rgba(0,0,0,0.15)`
        : `0 2px 8px ${color}20, 0 2px 4px rgba(0,0,0,0.1)`
    }}
    aria-label={label}
  />
);

const FONT_STACKS: Record<string, string> = {
  Inter: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  Poppins: "'Poppins', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, 'Noto Sans', sans-serif",
  Nunito: "'Nunito', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, 'Noto Sans', sans-serif",
  Outfit: "'Outfit', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, 'Noto Sans', sans-serif",
  Roboto: "Roboto, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  Lato: "Lato, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  Montserrat: "Montserrat, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, 'Noto Sans', sans-serif",
  'Source Sans 3': "'Source Sans 3', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
};

// Gradient-glow icon button with pointer "spotlight"
const GlowIconButton = ({
    Icon,
    onClick,
    title,
    size = "md",
    colors,
    type = 'primary',
}: {
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    onClick?: () => void;
    title?: string;
    size?: "sm" | "md" | "lg";
    colors: string[]; // pass array of colors from theme
    type?: 'primary' | 'academic' | 'productivity' | 'navigation' | 'feature';
}) => {
    const dims =
        size === "lg" ? "h-12 w-12" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
    
    const colorScheme = getIconColorScheme(type, colors);
    const { primary, secondary, glow, accent } = colorScheme;

    return (
        <button
        type="button"
        title={title}
        onClick={onClick}
        onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;
            e.currentTarget.style.setProperty("--mx", `${x}px`);
            e.currentTarget.style.setProperty("--my", `${y}px`);
        }}
        className={`relative group inline-grid place-items-center ${dims} shrink-0 p-0 rounded-2xl
                    border border-white/20 dark:border-white/10
                    bg-gradient-to-br from-white/95 via-white/90 to-white/80 
                    dark:from-neutral-800/90 dark:via-neutral-800/70 dark:to-neutral-900/60
                    backdrop-blur-md overflow-hidden transition-all duration-300
                    hover:scale-105 active:scale-95
                    shadow-lg hover:shadow-2xl`}        
        style={{
            background: `linear-gradient(135deg, ${primary}15 0%, ${secondary}10 50%, ${glow}08 100%)`
        }}
        >
        {/* Enhanced outer glow */}
        <span
            aria-hidden
            className="pointer-events-none absolute -inset-8 rounded-[32px] blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-500"
            style={{ 
                background: `conic-gradient(from 0deg, ${primary}40, ${secondary}30, ${glow}35, ${accent}25, ${primary}40)`,
                animation: 'spin 8s linear infinite'
            }}
        />
        
        {/* Rotating border gradient */}
        <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
            style={{
                background: `conic-gradient(from 45deg, transparent 0%, ${primary}60 25%, transparent 50%, ${secondary}60 75%, transparent 100%)`,
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'xor',
                padding: '1px'
            }}
        />
        
        {/* Mouse spotlight with enhanced colors */}
        <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
            style={{ 
                background: `radial-gradient(140px circle at var(--mx) var(--my), ${primary}30, ${secondary}15, transparent 60%)`,
                mixBlendMode: 'overlay'
            }}
        />
        
        {/* Base ambient glow */}
        <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl transition-all duration-300"
            style={{
                boxShadow: `
                    0 0 0 1px ${primary}20,
                    0 2px 8px ${primary}15,
                    0 4px 16px ${secondary}10,
                    inset 0 1px 0 rgba(255,255,255,0.1)
                `,
            }}
        />
        
        {/* Enhanced hover glow */}
        <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
            style={{
                boxShadow: `
                    0 0 0 1px ${primary}60,
                    0 4px 16px ${primary}40,
                    0 8px 32px ${secondary}30,
                    0 16px 48px ${glow}20,
                    inset 0 1px 0 rgba(255,255,255,0.2)
                `,
            }}
        />
        
        {/* Icon with enhanced styling */}
        <Icon className="relative z-10 block h-5 w-5 m-0 transition-all duration-200 group-hover:scale-110" 
              style={{ 
                  filter: `drop-shadow(0 1px 2px ${primary}30)`,
                  color: `${primary}`
              }} 
        />
        </button>
    );
};


type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;
const Stat = ({ label, value, icon: Icon, hint, colors, onIconClick, iconType = 'academic' }: { 
  label: string; 
  value: React.ReactNode; 
  icon: IconType; 
  hint?: string; 
  colors: string[]; 
  onIconClick?: () => void;
  iconType?: 'primary' | 'academic' | 'productivity' | 'navigation' | 'feature';
}) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
    <Card className="border-0 shadow-lg rounded-3xl bg-white/80 dark:bg-neutral-900/60">
      <CardContent className="relative p-4 sm:p-5">
        <div className="flex flex-col gap-3">
            <div className="self-start">
                <GlowIconButton Icon={Icon} colors={colors} onClick={onIconClick} type={iconType} />
            </div>
            <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="text-2xl font-extrabold mt-1 truncate">{value}</p>
                {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const Feature = ({ icon: Icon, title, desc, cta, colors, onClick, iconType = 'feature' }: { 
  icon: IconType; 
  title: string; 
  desc: string; 
  cta?: string; 
  colors: string[]; 
  onClick?: () => void;
  iconType?: 'primary' | 'academic' | 'productivity' | 'navigation' | 'feature';
}) => (
  <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
    <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md hover:scale-[1.02] group">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-3">
            <GlowIconButton Icon={Icon} colors={colors} type={iconType} />
            <h3 className="font-semibold text-lg tracking-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">{title}</h3>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">{desc}</p>
        {cta && (
          <Button variant="outline" className="rounded-2xl border-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/50 dark:hover:to-purple-950/50 transition-all duration-300" onClick={onClick}>{cta}</Button>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

export default function AcademicQuestDashboard() {
  // User customizations (persisted to localStorage)
  const [compact, setCompact] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [studyHoursOpen, setStudyHoursOpen] = useState(false);
  const [gamificationOpen, setGamificationOpen] = useState(false);
  const [gamificationTab, setGamificationTab] = useState<'status' | 'badges' | 'quests'>('status');

  useEffect(() => {
    const saved = localStorage.getItem("aq:settings");
    if (saved) {
      try {
        const { compact } = JSON.parse(saved);
        if (typeof compact === "boolean") setCompact(compact);
      } catch {
        // ignore
      }
    }
  }, []);

  // Add CSS animation for rotating glow effect
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // router nav
  const navigate = useNavigate();

  // Store-driven theme hooks
  const theme = useTheme();
  const COLORS = useColors();
  const gamification = useGamification();
  const years = useAcademicPlan((s) => s.years);
  const selectedYearId = useAcademicPlan((s) => s.selectedYearId);
  const setSelectedYear = useAcademicPlan((s) => s.setSelectedYear);
  const gpaScale = useSettings((s) => s.gpaScale);
  const tasks = useTasksStore((s) => s.tasks);
  const addTask = useTasksStore((s) => s.addTask);
  const updateTask = useTasksStore((s) => s.updateTask);
  const studySessions = useStudySessions((s) => s.sessions);

  // Attendance store hooks
  const { 
    markAttendance,
    getAttendanceForDate,
    addAttendanceRecord
  } = useAttendance();

  // Attendance dialog state
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<{
    time: string;
    course: string;
    room?: string;
    slotId?: string;
  } | null>(null);

  // Initialize gamification once on mount
  useEffect(() => {
    // Use setTimeout to avoid the infinite loop during initialization
    const timer = setTimeout(() => {
      gamification.generateDailyQuests()
      gamification.checkAchievements()
      
      // Reward daily login
      const today = new Date().toISOString().split('T')[0]
      const lastActive = gamification.stats.lastActiveDate
      
      if (lastActive !== today) {
        gamification.addXP(10) // Daily login bonus
        gamification.incrementStreak()
      }
    }, 100)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run once on mount

  // derive active year/term for quick-add defaults
  const activeYear = React.useMemo(() => {
    const yid = selectedYearId || years[0]?.id;
    return years.find((y) => y.id === yid);
  }, [years, selectedYearId]);
  const activeTerm = React.useMemo(() => activeYear?.terms?.[0], [activeYear]);

  // Tasks completion percent (match Tasks tab: only filled tasks by title, current term)
  const taskPct = React.useMemo(() => {
    const yid = activeYear?.id;
    const tid = activeTerm?.id;
    if (!yid || !tid) return 0;
    const termTasks = tasks.filter((t) => t.yearId === yid && t.termId === tid);
    const filled = termTasks.filter((t) => (t.title?.trim()?.length ?? 0) > 0);
    if (!filled.length) return 0;
    const completed = filled.filter((t) => t.status === "Completed").length;
    return Math.round((completed / filled.length) * 100);
  }, [tasks, activeYear?.id, activeTerm?.id]);

  const taskDonutData = React.useMemo(() => ([
    { name: "Complete", value: taskPct },
    { name: "Remaining", value: 100 - taskPct },
  ]), [taskPct]);

  // Real study trend data for the last 7 days
  const studyTrend = React.useMemo(() => {
    const now = new Date();
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 6);
    
    const dayData = minutesByDay(studySessions, startDate, endDate);
    
    return dayData.map(({ date, minutes }) => {
      const dateObj = new Date(date);
      return {
        d: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        h: Math.round((minutes / 60) * 10) / 10 // Convert minutes to hours with 1 decimal
      };
    });
  }, [studySessions]);

  // Current term totals from Academic Planner: Units and GPA
  const totalUnits = React.useMemo(() => {
    const courses = activeTerm?.courses || [];
    return courses.reduce((sum, r) => sum + (Number(r.credits) || 0), 0);
  }, [activeTerm?.courses]);

  const termGPA = React.useMemo(() => {
    const courses = activeTerm?.courses || [];
    const { wSum, cSum } = courses.reduce(
      (acc, r) => {
        const cr = Number(r.credits) || 0;
        const gp = typeof r.gpa === "number" ? r.gpa : undefined;
        if (cr > 0 && gp !== undefined) { acc.wSum += cr * gp; acc.cSum += cr; }
        return acc;
      },
      { wSum: 0, cSum: 0 }
    );
    return cSum > 0 ? wSum / cSum : 0;
  }, [activeTerm?.courses]);

  const displayGPA = React.useMemo(() => {
    const g = Math.max(0, Math.min(4, termGPA));
    return gpaScale === '1-highest' ? (5 - g) : g;
  }, [termGPA, gpaScale]);

  // Build grade distribution buckets from the current term's filled GPAs (raw 0–4 scale)
  type DistBucket = { range: string; min: number; max: number; count: number };
  const gradeDist: DistBucket[] = React.useMemo(() => {
    const buckets: DistBucket[] = [
      { range: '3.50–4.00', min: 3.5, max: 4.01, count: 0 },
      { range: '3.00–3.49', min: 3.0, max: 3.5, count: 0 },
      { range: '2.50–2.99', min: 2.5, max: 3.0, count: 0 },
      { range: '2.00–2.49', min: 2.0, max: 2.5, count: 0 },
      { range: '< 2.00',     min: -0.01, max: 2.0, count: 0 },
    ];
    const courses = activeTerm?.courses || [];
    courses.forEach((r) => {
      if (typeof r.gpa !== 'number') return;
      const g = Math.max(0, Math.min(4, r.gpa));
      const b = buckets.find(bk => g >= bk.min && g < bk.max);
      if (b) b.count += 1;
    });
    return buckets;
  }, [activeTerm?.courses]);

  // Details modal state
  const [gradesOpen, setGradesOpen] = useState(false);

  // Additional term performance stats for the details dialog
  const termStats = React.useMemo(() => {
    const courses = (activeTerm?.courses || []).filter(r => typeof r.gpa === 'number');
    const n = courses.length;
    if (!n) return {
      count: 0, credits: 0, avg: 0, avgDisplay: 0, median: 0, medianDisplay: 0, best: 0, bestDisplay: 0, worst: 0, worstDisplay: 0,
      weighted: termGPA, weightedDisplay: displayGPA,
      coursesSorted: [] as typeof courses,
    };
    const credits = courses.reduce((s, r) => s + (Number(r.credits) || 0), 0);
    const gpas = courses.map(r => Math.max(0, Math.min(4, r.gpa as number))).sort((a,b)=>a-b);
    const avg = gpas.reduce((s,g)=>s+g,0) / n;
    const median = n % 2 ? gpas[(n-1)/2] : (gpas[n/2 - 1] + gpas[n/2]) / 2;
    const best = gpas[gpas.length - 1];
    const worst = gpas[0];
    const convert = (g: number) => gpaScale === '1-highest' ? (5 - g) : g;
    const coursesSorted = [...courses].sort((a,b)=> (b.gpa as number) - (a.gpa as number));
    return {
      count: n,
      credits,
      avg,
      avgDisplay: convert(avg),
      median,
      medianDisplay: convert(median),
      best,
      bestDisplay: convert(best),
      worst,
      worstDisplay: convert(worst),
      weighted: termGPA,
      weightedDisplay: displayGPA,
      coursesSorted,
    };
  }, [activeTerm?.courses, termGPA, displayGPA, gpaScale]);

  // quick add task dialog state
  const [quickOpen, setQuickOpen] = useState(false);
  const [qTitle, setQTitle] = useState("");
  const [qDate, setQDate] = useState("");
  const [qTime, setQTime] = useState("");
  const [qStatus, setQStatus] = useState<"Not Started"|"In Progress"|"Completed">("Not Started");
  function commitQuickTask() {
    if (!qTitle.trim() || !activeYear?.id || !activeTerm?.id) { setQuickOpen(false); return; }
    const t: AQTask = {
      id: crypto.randomUUID(),
      yearId: activeYear.id,
      termId: activeTerm.id,
      courseId: undefined,
      title: qTitle.trim(),
      status: qStatus,
      dueDate: qDate || undefined,
      dueTime: qTime || undefined,
      grade: undefined,
    };
  addTask(t);
  // ensure Tasks tab opens on the same year as the new task
  if (activeYear?.id) setSelectedYear(activeYear.id);
  setQuickOpen(false);
    setQTitle(""); setQDate(""); setQTime(""); setQStatus("Not Started");
  // jump to Tasks tab
  navigate("/tasks");
  }
  
  // pull today's classes from the active term in the schedule store
  const getActiveTermForDate = useSchedule((s) => s.getActiveTermForDate);
  
  // Get today's slots with full slot information including IDs
  const todaySlots = React.useMemo(() => {
    const d = new Date();
    const dow = d.getDay() as DayIndex;
    
    // Get the active term for today
    const active = getActiveTermForDate(d);
    const term = active?.term;
    
    if (!term) return [];
    
    // Get actual slot objects with IDs
    const slots = term.slots.filter(sl => sl.day === dow);
    return slots
      .slice()
      .sort((a, b) => {
        const toMin = (t: string) => {
          const [h, m] = t.split(":").map(Number);
          return h * 60 + m;
        };
        return toMin(a.start) - toMin(b.start);
      })
      .map(sl => ({
        time: sl.start,
        course: sl.title || sl.courseCode || "Class",
        room: sl.room,
        slotId: sl.id // Include the actual slot ID
      }));
  }, [getActiveTermForDate]);

  // Handle clicking on a schedule item to mark attendance
  const handleScheduleItemClick = (scheduleItem: { time: string; course: string; room?: string; slotId?: string }) => {
    setSelectedScheduleItem(scheduleItem);
    setAttendanceDialogOpen(true);
  };

  // Mark attendance for the selected class
  const handleMarkAttendance = async (attended: boolean) => {
    if (!selectedScheduleItem) return;
    
    const today = new Date().toISOString().split('T')[0];
    const slotId = selectedScheduleItem.slotId || 
      `${selectedScheduleItem.time}-${selectedScheduleItem.course}`.replace(/[^a-zA-Z0-9]/g, '-');
    
    // Check if attendance record exists for today
    const todayRecord = getAttendanceForDate(today);
    
    if (!todayRecord) {
      // Create new attendance record for today with this class
      const classAttendance = {
        date: today,
        slotId,
        courseCode: selectedScheduleItem.course.split(' ')[0] || selectedScheduleItem.course,
        courseName: selectedScheduleItem.course,
        attended,
        marked: true,
        time: selectedScheduleItem.time,
        room: selectedScheduleItem.room
      };
      
      addAttendanceRecord(today, [classAttendance]);
    } else {
      // Mark attendance for existing record
      await markAttendance(today, slotId, attended);
    }
    
    // Reward gamification points
    if (attended) {
      gamification.addXP(10);
    }
    
    gamification.checkAchievements();
    setAttendanceDialogOpen(false);
    setSelectedScheduleItem(null);
  };

  // Get attendance status for a schedule item
  const getAttendanceStatus = (scheduleItem: { time: string; course: string; slotId?: string }) => {
    const today = new Date().toISOString().split('T')[0];
    const slotId = scheduleItem.slotId || `${scheduleItem.time}-${scheduleItem.course}`.replace(/[^a-zA-Z0-9]/g, '-');
    const todayRecord = getAttendanceForDate(today);
    
    if (!todayRecord) return { marked: false, attended: false };
    
    const classRecord = todayRecord.classes.find(c => c.slotId === slotId);
    if (!classRecord) return { marked: false, attended: false };
    
    return { marked: classRecord.marked, attended: classRecord.attended };
  };


  const [localCompact, setLocalCompact] = useState(compact);
  useEffect(() => { if (localCompact !== compact) setLocalCompact(compact); }, [compact, localCompact]);

  // And add another effect to commit changes:
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localCompact !== compact) setCompact(localCompact);
    }, 100);
    return () => clearTimeout(timer);
  }, [localCompact, compact, setCompact]);

  // local mirror so dragging doesn't write to the store every tick
  const [accentLocal, setAccentLocal] = useState(theme.accent);

  // keep local in sync only when theme.accent itself changes
  useEffect(() => {
    setAccentLocal(theme.accent);
  }, [theme.accent]);


  // apply global font & dark/class mode
  useEffect(() => {
      const stack = FONT_STACKS[theme.font] ?? FONT_STACKS['Inter'];
      document.body.style.fontFamily = stack;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = theme.mode === 'dark' || (theme.mode === 'system' && prefersDark);
      document.documentElement.classList.toggle('dark', dark);
      
      // Inject scrollbar styles
      let styleElement = document.getElementById('aq-scrollbar-styles') as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'aq-scrollbar-styles';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = scrollbarStyles;
  }, [theme.font, theme.mode]);

  // Background style from local accent + palette
  const bgStyle = useMemo(() => {
    // Use accentLocal for live updates instead of theme.accent
  // Map 0–100 -> 0–0.5 for a more noticeable range
  const alpha = Math.min(0.5, Math.max(0.0, accentLocal / 150));
    const hex = Math.round(alpha * 255).toString(16).padStart(2, '0');

    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme.mode === 'dark' || (theme.mode === 'system' && systemDark);

    // lighter base for light mode, deeper base for dark mode
    const baseLinear = isDark
      ? 'linear-gradient(135deg, #0b0f19 0%, #0a0a0a 70%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f8fbff 65%)';

    // keep palette tints on top in both modes
    const tintA = `radial-gradient(circle at 10% 0%, ${COLORS[0]}${hex} 0%, transparent 40%)`;
    const tintB = `radial-gradient(circle at 90% 10%, ${COLORS[3]}${hex} 0%, transparent 45%)`;
    const tintC = `radial-gradient(circle at 50% 120%, ${COLORS[2]}${hex} 0%, transparent 55%)`;

    return {
      backgroundImage: `${tintA}, ${tintB}, ${tintC}, ${baseLinear}`,
      backgroundRepeat: 'no-repeat, no-repeat, no-repeat, no-repeat',
      backgroundAttachment: 'fixed, fixed, scroll, fixed',
      backgroundPosition: '10% 0%, 90% 10%, 50% 100%, 0 0',
    } as React.CSSProperties;
  }, [accentLocal, theme.mode, COLORS]); // Use accentLocal instead of theme.accent


      const todayStr = useMemo(
      () =>
          new Intl.DateTimeFormat(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          }).format(new Date()),
      []
      );
      const xpPct = Math.min(100, Math.round(((gamification.stats.totalXp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100));

      // Get scrollbar class based on theme
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = theme.mode === 'dark' || (theme.mode === 'system' && systemDark);
      const scrollbarClass = isDark ? 'dark-scrollbar' : 'light-scrollbar';

    return (
          <div
              className={`min-h-screen w-full overflow-x-hidden ${scrollbarClass}`}
              style={bgStyle}
          >
        <div className={`w-full px-4 sm:px-6 lg:px-12 ${compact ? "py-4" : "py-8"}`}>
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className={`rounded-3xl ${compact ? "p-5" : "p-8"} shadow-xl border border-black/5 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <GraduationCap className="h-6 w-6" />
                  <span className="text-sm text-neutral-600">{mock.term}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  Academic Quest — Dashboard
                </h1>
                <p className="mt-2 text-sm md:text-base text-neutral-600 max-w-2xl">
                  Your all‑in‑one Gamified Academic Tracker for Productivity.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button 
                    className="rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 
                             dark:from-blue-500 dark:via-purple-500 dark:to-blue-600
                             hover:from-blue-700 hover:via-purple-700 hover:to-blue-800
                             dark:hover:from-blue-600 dark:hover:via-purple-600 dark:hover:to-blue-700
                             shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95
                             text-white font-medium tracking-wide
                             border-0 ring-2 ring-blue-200/50 dark:ring-purple-400/30 hover:ring-blue-300/70 dark:hover:ring-purple-300/50
                             transform hover:-translate-y-0.5 active:translate-y-0" 
                    onClick={() => navigate("/planner")}
                  >
                    <span className="relative z-10">Open Planner</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-2xl border-2 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/90 dark:to-neutral-900/80 
                             backdrop-blur-md hover:from-green-50/90 hover:to-emerald-50/80 dark:hover:from-green-950/40 dark:hover:to-emerald-950/30 
                             border-neutral-200/60 dark:border-neutral-600/40 hover:border-green-200/60 dark:hover:border-emerald-400/30
                             shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95
                             text-neutral-700 dark:text-neutral-200 hover:text-green-700 dark:hover:text-emerald-300
                             font-medium tracking-wide"
                    onClick={() => setQuickOpen(true)}
                  >
                    <span>Quick Add Task</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-2xl border-2 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/90 dark:to-neutral-900/80 
                             backdrop-blur-md hover:from-orange-50/90 hover:to-amber-50/80 dark:hover:from-orange-950/40 dark:hover:to-amber-950/30 
                             border-neutral-200/60 dark:border-neutral-600/40 hover:border-orange-200/60 dark:hover:border-amber-400/30
                             shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95
                             text-neutral-700 dark:text-neutral-200 hover:text-orange-700 dark:hover:text-amber-300
                             font-medium tracking-wide" 
                    onClick={() => {
                      // Force show Pomodoro at bottom-right corner
                      localStorage.setItem('aq:pomo-corner', 'br')
                      // Force a re-render by updating the value and triggering a custom event
                      window.dispatchEvent(new CustomEvent('pomo-show', { detail: { corner: 'br' } }))
                      // Also try the storage event
                      window.dispatchEvent(new StorageEvent('storage', {
                        key: 'aq:pomo-corner',
                        newValue: 'br'
                      }))
                    }}
                  >
                    <Timer className="h-4 w-4 mr-2" />
                    <span>Show Pomodoro</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="rounded-2xl bg-transparent text-foreground hover:bg-gradient-to-r hover:from-gray-100/80 hover:to-gray-200/60 
                             dark:hover:from-gray-700/60 dark:hover:to-gray-800/80 dark:bg-neutral-900/60 border-0 shadow-none 
                             focus-visible:outline-none focus-visible:ring-0 transition-all duration-300 hover:scale-105 active:scale-95
                             hover:shadow-lg dark:hover:shadow-gray-900/50 transform hover:-translate-y-0.5 active:translate-y-0
                             font-medium tracking-wide" 
                    onClick={() => navigate('/settings')}
                  >
                    <span className="relative z-10">Settings</span>
                  </Button>
                </div>
              </div>

              {/* Gamified XP Card */}
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-neutral-900/60 rounded-3xl w-full md:w-[360px]">
                <CardContent className={`${compact ? "p-5" : "p-6"}`}>
                  <div className="flex items-center justify-between mb-2">
                      <div className="inline-flex items-center gap-2 text-neutral-600">
                          <CalendarDays className="h-4 w-4" />
                          <span className="text-xs md:text-sm">{todayStr}</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          <span className="text-sm font-semibold">Lvl {gamification.stats.level}</span>
                      </div>
                  </div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Adventurer Status</p>
                  <div className="relative w-full h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${xpPct}%`,
                        boxShadow: xpPct >= 80 ? [
                          `0 0 10px ${COLORS[0]}40`,
                          `0 0 20px ${COLORS[0]}60`, 
                          `0 0 10px ${COLORS[0]}40`
                        ] : `0 0 10px ${COLORS[0]}40`
                      }}
                      transition={{ 
                        duration: 1.2, 
                        ease: "easeOut",
                        delay: 0.2,
                        boxShadow: {
                          duration: 2,
                          repeat: xpPct >= 80 ? Infinity : 0,
                          repeatType: "reverse"
                        }
                      }}
                      className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r"
                      style={{ 
                        background: `linear-gradient(90deg, ${COLORS[0]}, ${COLORS[1]})`
                      }}
                    />
                    {/* Shine effect - more frequent when close to level up */}
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{
                        duration: 2,
                        delay: 1.5,
                        repeat: Infinity,
                        repeatDelay: xpPct >= 80 ? 2 : 4
                      }}
                      className="absolute top-0 left-0 h-full w-6 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                      style={{ filter: "blur(1px)" }}
                    />
                    {/* Level up indicator when very close */}
                    {xpPct >= 90 && (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [0.6, 1, 0.6]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs"
                      >
                        ⚡
                      </motion.div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-neutral-600">
                      <span>{gamification.stats.totalXp % XP_PER_LEVEL} / {XP_PER_LEVEL} XP</span>
                      <span>🔥 Streak: {gamification.stats.streakDays}d</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                      <Button 
                        size="sm" 
                        className="rounded-2xl bg-gradient-to-r from-purple-600/90 to-violet-600/90 dark:from-purple-500/90 dark:to-violet-500/90
                                  hover:from-purple-700/95 hover:to-violet-700/95 dark:hover:from-purple-400/95 dark:hover:to-violet-400/95
                                  text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                                  hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                                  font-medium tracking-wide backdrop-blur-md
                                  ring-2 ring-purple-200/50 dark:ring-purple-400/30 hover:ring-purple-300/60 dark:hover:ring-purple-300/40"
                        onClick={() => { setGamificationTab('status'); setGamificationOpen(true); }}
                      >
                        Status
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-2xl border-2 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/90 dark:to-neutral-900/80 
                                 backdrop-blur-md hover:from-purple-50/90 hover:to-violet-50/80 dark:hover:from-purple-950/40 dark:hover:to-violet-950/30 
                                 border-neutral-200/60 dark:border-neutral-600/40 hover:border-purple-200/60 dark:hover:border-violet-400/30
                                 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95
                                 text-neutral-700 dark:text-neutral-200 hover:text-purple-700 dark:hover:text-violet-300
                                 font-medium tracking-wide"
                        onClick={() => { setGamificationTab('badges'); setGamificationOpen(true); }}
                      >
                        <span>View Badges</span>
                      </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Personalization Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-neutral-900/60 rounded-3xl">
                  <CardContent className="p-5">
                      <h3 className="font-semibold mb-3">Theme</h3>
                      <div className="flex items-center gap-3">
                          <div className="space-y-2">
                          <Label className="text-xs text-neutral-600">Primary</Label>
                          <div className="flex items-center gap-2">
                              <Chip color="#0ea5e9" active={theme.palette === "sky"} onClick={() => theme.setPalette("sky")} label="Sky" />
                              <Chip color="#8b5cf6" active={theme.palette === "violet"} onClick={() => theme.setPalette("violet")} label="Violet" />
                              <Chip color="#10b981" active={theme.palette === "emerald"} onClick={() => theme.setPalette("emerald")} label="Emerald" />
                          </div>
                          </div>
                           <div className="flex-1">
                              <Label className="text-xs text-neutral-600">Accent intensity</Label>
                              <input
                                type="range"
                                className="w-full"
                                min={0}
                                max={100}
                                step={1}
                                value={accentLocal}
                                onChange={(e) => {
                                  const next = Math.max(0, Math.min(100, Number(e.target.value)));
                                  setAccentLocal(next);
                                  if (next !== theme.accent) theme.setAccent(next);
                                }}
                                onMouseUp={() => accentLocal !== theme.accent && theme.setAccent(accentLocal)}
                                onTouchEnd={() => accentLocal !== theme.accent && theme.setAccent(accentLocal)}
                                onWheel={(e) => {
                                  e.preventDefault();
                                  const delta = e.deltaY < 0 ? 2 : -2;
                                  const next = Math.max(0, Math.min(100, accentLocal + delta));
                                  if (next !== accentLocal) {
                                    setAccentLocal(next);
                                    if (next !== theme.accent) theme.setAccent(next);
                                  }
                                }}
                              />
                            </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                          {/* Theme Mode — bubble buttons */}
                          <div className="col-span-3">
                            <Label className="text-xs text-neutral-600">Theme mode</Label>
                            <div className="mt-2 flex gap-2">
                              {([
                                { key: "light", Icon: Sun, label: "Light" },
                                { key: "dark", Icon: Moon, label: "Dark" },
                                { key: "system", Icon: Monitor, label: "System" },
                              ] as const).map(({ key, Icon, label }) => {
                                const active = theme.mode === key;
                                return (
                                  <Button
                                    key={key}
                                    type="button"
                                    variant="ghost"
                                    onClick={() => theme.setMode(key as "light" | "dark" | "system")}
                                    className={`h-9 px-3 gap-2 rounded-2xl transition-all duration-200 
                                      hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                                      ${active 
                                        ? "bg-gradient-to-r from-blue-600/90 to-indigo-600/90 dark:from-blue-500/90 dark:to-indigo-500/90 text-white shadow-lg ring-2 ring-blue-200/50 dark:ring-blue-400/30 backdrop-blur-md" 
                                        : "bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/90 dark:to-neutral-900/80 text-neutral-700 dark:text-neutral-200 hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 hover:text-blue-700 dark:hover:text-blue-300 shadow-md hover:shadow-lg backdrop-blur-md border border-neutral-200/60 dark:border-neutral-600/40 hover:border-blue-200/60 dark:hover:border-blue-400/30"}
                                      font-medium tracking-wide focus-visible:outline-none focus-visible:ring-0`}
                                    aria-pressed={active}
                                  >
                                    <Icon className="h-4 w-4 mr-1" />
                                    <span>{label}</span>
                                  </Button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Compact layout (2 columns) */}
                          <div className="flex items-center justify-between col-span-2">
                              <Label className="text-xs text-neutral-600">Compact layout</Label>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={compact}
                                  onChange={e => setCompact(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              </label>
                          </div>

                          {/* Font family (1 column) */}
                          <div>
                              <Label className="text-xs text-neutral-600">Font family</Label>
                              <Select value={theme.font} onValueChange={(v) => theme.setFont(v)}>
                                  <SelectTrigger className="mt-1 h-9 rounded-xl border border-black/10 bg-white/80 dark:bg-neutral-900/60 hover:bg-white transition">
                                      <SelectValue placeholder="Choose a font" />
                                  </SelectTrigger>
                              {/* animated dropdown */}
                                  <SelectContent className="rounded-xl border border-black/10 bg-white/80 dark:bg-neutral-900/60 shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
                                      {["Inter","Poppins","Nunito","Outfit","Roboto","Lato","Montserrat","Source Sans 3"].map(f => (
                                      <SelectItem
                                          key={f}
                                          value={f}
                                          className="cursor-pointer transition hover:bg-black/5"
                                          >
                                          {f}
                                      </SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                      </div>
                  </CardContent>
              </Card>

            <Card className="border-0 shadow-lg bg-white/80 dark:bg-neutral-900/60 rounded-3xl">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-3">Quick Overview</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ">
                    <Stat label="Current GPA" value={displayGPA.toFixed(2)} icon={Calculator} hint="Auto‑computed from Academic Planner" colors={COLORS} onIconClick={() => navigate("/planner")} iconType="academic" />
                    <Stat label="Units" value={totalUnits} icon={School} hint="Enrolled this term" colors={COLORS} onIconClick={() => navigate("/planner")} iconType="primary" />
                    <Stat label="Tasks Done" value={`${taskPct}%`} icon={ClipboardList} hint="This term" colors={COLORS} onIconClick={() => navigate("/tasks")} iconType="productivity" />
                  </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 dark:bg-neutral-900/60 rounded-3xl">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-3">Task Completion</h3>
    <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        dataKey="value"
      data={taskDonutData}
                        innerRadius={55}
                        outerRadius={80}
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={2}
                        cornerRadius={3}
                        stroke="transparent"
                        isAnimationActive
                        animationBegin={100}
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
      {taskDonutData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex items-center justify-center gap-5 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: COLORS[0] }}
                    />
                    Complete
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: COLORS[1] }}
                    />
                    Remaining
                  </span>
                </div>
                <p className="text-sm text-neutral-600">{taskPct}% completed this term</p>
              </CardContent>
            </Card>
          </div>

          {/* Middle: Schedule + Study trend + Quick tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-lg rounded-3xl bg-white/80 dark:bg-neutral-900/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Today’s Schedule</h3>
                      {navigate ? (
                        <Button 
                          variant="outline" 
                          className="rounded-2xl border-2 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/90 dark:to-neutral-900/80 
                                   backdrop-blur-md hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 
                                   border-neutral-200/60 dark:border-neutral-600/40 hover:border-blue-200/60 dark:hover:border-indigo-400/30
                                   shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95
                                   text-neutral-700 dark:text-neutral-200 hover:text-blue-700 dark:hover:text-indigo-300
                                   font-medium tracking-wide"
                          onClick={() => navigate!("/schedule")}
                        >
                          <CalendarDays className="h-4 w-4 mr-2" />
                          <span>View Week</span>
                        </Button>
                      ) : (
                        <a href="/schedule">
                          <Button 
                            variant="outline" 
                            className="rounded-2xl border-2 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/90 dark:to-neutral-900/80 
                                     backdrop-blur-md hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 
                                     border-neutral-200/60 dark:border-neutral-600/40 hover:border-blue-200/60 dark:hover:border-indigo-400/30
                                     shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95
                                     text-neutral-700 dark:text-neutral-200 hover:text-blue-700 dark:hover:text-indigo-300
                                     font-medium tracking-wide"
                          >
                            <CalendarDays className="h-4 w-4 mr-2" />
                            <span>View Week</span>
                          </Button>
                        </a>
                      )}
                  </div>
                  <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {(todaySlots.length ? todaySlots : mock.scheduleToday).map((s, i) => {
                      // Dynamic color scheme based on index
                      const colorSchemes = [
                        {
                          bg: 'from-blue-50/80 to-indigo-100/60 dark:from-blue-950/40 dark:to-indigo-950/30',
                          border: 'border-blue-200/50 dark:border-blue-800/30',
                          timeColor: 'text-blue-600 dark:text-blue-400',
                          courseColor: 'text-blue-800 dark:text-blue-200',
                          roomColor: 'text-indigo-600 dark:text-indigo-400',
                          accent: 'bg-blue-500'
                        },
                        {
                          bg: 'from-emerald-50/80 to-green-100/60 dark:from-emerald-950/40 dark:to-green-950/30',
                          border: 'border-emerald-200/50 dark:border-emerald-800/30',
                          timeColor: 'text-emerald-600 dark:text-emerald-400',
                          courseColor: 'text-emerald-800 dark:text-emerald-200',
                          roomColor: 'text-green-600 dark:text-green-400',
                          accent: 'bg-emerald-500'
                        },
                        {
                          bg: 'from-purple-50/80 to-violet-100/60 dark:from-purple-950/40 dark:to-violet-950/30',
                          border: 'border-purple-200/50 dark:border-purple-800/30',
                          timeColor: 'text-purple-600 dark:text-purple-400',
                          courseColor: 'text-purple-800 dark:text-purple-200',
                          roomColor: 'text-violet-600 dark:text-violet-400',
                          accent: 'bg-purple-500'
                        },
                        {
                          bg: 'from-amber-50/80 to-orange-100/60 dark:from-amber-950/40 dark:to-orange-950/30',
                          border: 'border-amber-200/50 dark:border-amber-800/30',
                          timeColor: 'text-amber-600 dark:text-amber-400',
                          courseColor: 'text-amber-800 dark:text-amber-200',
                          roomColor: 'text-orange-600 dark:text-orange-400',
                          accent: 'bg-amber-500'
                        },
                        {
                          bg: 'from-rose-50/80 to-pink-100/60 dark:from-rose-950/40 dark:to-pink-950/30',
                          border: 'border-rose-200/50 dark:border-rose-800/30',
                          timeColor: 'text-rose-600 dark:text-rose-400',
                          courseColor: 'text-rose-800 dark:text-rose-200',
                          roomColor: 'text-pink-600 dark:text-pink-400',
                          accent: 'bg-rose-500'
                        }
                      ];
                      
                      const scheme = colorSchemes[i % colorSchemes.length];
                      const attendanceStatus = getAttendanceStatus(s);
                      
                      return (
                        <motion.div
                          key={`${s.time}-${s.course}-${i}`}
                          initial={{ opacity: 0, y: 12, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            delay: i * 0.1, 
                            duration: 0.4,
                            type: "spring",
                            stiffness: 100,
                            damping: 20
                          }}
                          whileHover={{ 
                            scale: 1.02, 
                            y: -2,
                            transition: { duration: 0.2 }
                          }}
                          className={`relative group p-5 rounded-2xl bg-gradient-to-br ${scheme.bg} 
                                    border-2 ${scheme.border} shadow-lg hover:shadow-xl 
                                    transition-all duration-300 cursor-pointer backdrop-blur-sm
                                    overflow-hidden`}
                          onClick={() => handleScheduleItemClick(s)}
                        >
                          {/* Accent line */}
                          <div className={`absolute left-0 top-0 w-1 h-full ${scheme.accent} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}></div>
                          
                          {/* Attendance Status Indicator */}
                          {attendanceStatus.marked && (
                            <div className={`absolute top-3 right-3 p-1.5 rounded-full ${
                              attendanceStatus.attended 
                                ? 'bg-green-500 text-white' 
                                : 'bg-red-500 text-white'
                            } shadow-lg`}>
                              {attendanceStatus.attended ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                            </div>
                          )}
                          
                          {/* Pending Attendance Indicator */}
                          {!attendanceStatus.marked && (
                            <div className="absolute top-3 right-3 p-1.5 rounded-full bg-amber-500 text-white shadow-lg animate-pulse">
                              <AlertCircle className="h-3 w-3" />
                            </div>
                          )}
                          
                          {/* Time badge */}
                          <div className="flex items-center justify-between mb-3">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/60 dark:bg-black/20 
                                          border border-white/40 dark:border-white/10 backdrop-blur-sm`}>
                              <div className={`w-2 h-2 rounded-full ${scheme.accent}`}></div>
                              <span className={`text-sm font-bold ${scheme.timeColor}`}>{s.time}</span>
                            </div>
                            <div className={`p-1.5 rounded-lg bg-white/40 dark:bg-black/20 border border-white/30 dark:border-white/10`}>
                              <Clock className={`h-3 w-3 ${scheme.timeColor}`} />
                            </div>
                          </div>
                          
                          {/* Course info */}
                          <div className="space-y-2">
                            <h4 className={`font-bold text-lg ${scheme.courseColor} leading-tight`}>
                              {s.course}
                            </h4>
                            <div className="flex items-center gap-2">
                              <MapPin className={`h-4 w-4 ${scheme.roomColor}`} />
                              <span className={`text-sm font-medium ${scheme.roomColor}`}>
                                {s.room ?? "Room TBA"}
                              </span>
                            </div>
                          </div>
                          
                          {/* Click to mark attendance hint */}
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-black/50 px-2 py-1 rounded-lg backdrop-blur-sm">
                              Click to mark attendance
                            </span>
                          </div>
                          
                          {/* Subtle background pattern */}
                          <div className="absolute -right-4 -bottom-4 w-16 h-16 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                            <div className={`w-full h-full rounded-full ${scheme.accent} blur-xl`}></div>
                          </div>
                        </motion.div>
                      );
                    })}
                    
                    {!todaySlots.length && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="col-span-full p-8 rounded-2xl bg-gradient-to-br from-gray-50/80 to-gray-100/60 
                                 dark:from-gray-800/50 dark:to-gray-900/30 border-2 border-dashed 
                                 border-gray-300/50 dark:border-gray-600/30 text-center backdrop-blur-sm"
                      >
                        <div className="mb-4">
                          <CalendarX className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                          No classes scheduled for today
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
                          Add class blocks in <span className="font-semibold text-blue-600 dark:text-blue-400">Schedule Planner</span> and set the active term dates to populate Today's Schedule here.
                        </p>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg rounded-3xl bg-white/80 dark:bg-neutral-900/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Study Hours (7‑day)</h3>
                    <Button 
                      variant="ghost" 
                      className="rounded-2xl bg-transparent text-foreground hover:bg-gradient-to-r hover:from-neutral-100/80 hover:to-neutral-200/60 
                               dark:hover:from-neutral-700/60 dark:hover:to-neutral-800/80 dark:bg-neutral-900/60 border-0 shadow-none 
                               focus-visible:outline-none focus-visible:ring-0 transition-all duration-200 hover:scale-105 active:scale-95
                               hover:shadow-lg dark:hover:shadow-neutral-900/50 transform hover:-translate-y-0.5 active:translate-y-0
                               font-medium tracking-wide"
                      onClick={() => setStudyHoursOpen(true)}
                    >
                      Details
                    </Button>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RLineChart data={studyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="d" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="h" stroke={COLORS[0]} strokeWidth={3} dot={{ r: 3 }} />
                      </RLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Class Attendance Widget */}
              <AttendanceWidget />
            </div>

            <div className="space-y-6">
              {/* Quick Tasks (next 7 days) */}
              <Card className="border-0 shadow-lg rounded-3xl bg-white/80 dark:bg-neutral-900/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Quick Tasks for the Week</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="rounded-2xl border-2 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/90 dark:to-neutral-900/80 
                                 backdrop-blur-md hover:from-green-50/90 hover:to-emerald-50/80 dark:hover:from-green-950/40 dark:hover:to-emerald-950/30 
                                 border-neutral-200/60 dark:border-neutral-600/40 hover:border-green-200/60 dark:hover:border-emerald-400/30
                                 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95
                                 text-neutral-700 dark:text-neutral-200 hover:text-green-700 dark:hover:text-emerald-300
                                 font-medium tracking-wide"
                        onClick={() => setQuickOpen(true)}
                      >
                        <span>Add Task</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="rounded-2xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 dark:from-blue-500/90 dark:to-indigo-500/90
                                  hover:from-blue-700/95 hover:to-indigo-700/95 dark:hover:from-blue-400/95 dark:hover:to-indigo-400/95
                                  text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                                  hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                                  font-medium tracking-wide backdrop-blur-md
                                  ring-2 ring-blue-200/50 dark:ring-blue-400/30 hover:ring-blue-300/60 dark:hover:ring-blue-300/40"
                        onClick={() => navigate("/tasks")}
                      >
                        View Tasks
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {tasks.filter(t => t.status !== "Completed" && isWithinNextNDays(t.dueDate, 7)).slice(0,5).map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No due date"}{t.dueTime ? ` • ${t.dueTime}` : ""}</p>
                        </div>
                        <div className="shrink-0">
                          <Select value={t.status} onValueChange={(v: TaskStatus) => updateTask(t.id, { status: v })}>
                            <SelectTrigger className="h-8 rounded-xl w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border border-black/10 bg-white/80 dark:bg-neutral-900/60 shadow-xl">
                              <SelectItem value="Not Started">Not Started</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                    {tasks.filter(t => t.status !== "Completed" && isWithinNextNDays(t.dueDate, 7)).length === 0 && (
                      <p className="text-sm text-muted-foreground">No tasks due in the next 7 days.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg rounded-3xl bg-white/80 dark:bg-neutral-900/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">Grade Distribution</h3>
                    <Button
                      variant="ghost"
                      className="rounded-2xl bg-transparent text-foreground hover:bg-gradient-to-r hover:from-neutral-100/80 hover:to-neutral-200/60 
                               dark:hover:from-neutral-700/60 dark:hover:to-neutral-800/80 dark:bg-neutral-900/60 border-0 shadow-none 
                               focus-visible:outline-none focus-visible:ring-0 transition-all duration-200 hover:scale-105 active:scale-95
                               hover:shadow-lg dark:hover:shadow-neutral-900/50 transform hover:-translate-y-0.5 active:translate-y-0
                               font-medium tracking-wide"
                      onClick={() => setGradesOpen(true)}
                    >
                      <span className="relative z-10">More Details</span>
                    </Button>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gradeDist}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill={COLORS[1]} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Grade distribution details dialog */}
          <Dialog open={gradesOpen} onOpenChange={setGradesOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 
                                    dark:from-neutral-900/95 dark:via-neutral-900/90 dark:to-neutral-800/85 backdrop-blur-md
                                    ring-1 ring-white/20 dark:ring-white/10 flex flex-col">
              <DialogHeader className="flex-shrink-0 pb-4 border-b border-gray-200/30 dark:border-gray-700/30">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 
                                      dark:from-blue-400 dark:via-purple-400 dark:to-blue-300 bg-clip-text text-transparent">
                  Current Term Performance
                </DialogTitle>
              </DialogHeader>
              
              {/* Scrollable content area */}
              <div className={`flex-1 overflow-y-auto pr-2 ${scrollbarClass}`} style={{ maxHeight: 'calc(90vh - 120px)' }}>
                <div className="space-y-6 py-4">
                  {/* Enhanced Quick stats with modern cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 
                                  border border-blue-100/50 dark:border-blue-800/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">Courses with GPA</div>
                      <div className="text-2xl font-bold text-blue-800 dark:text-blue-200 mt-1">{termStats.count}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-green-50/60 dark:from-emerald-950/40 dark:to-green-950/30 
                                  border border-emerald-100/50 dark:border-emerald-800/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider">Total Credits</div>
                      <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mt-1">{termStats.credits}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 to-violet-50/60 dark:from-purple-950/40 dark:to-violet-950/30 
                                  border border-purple-100/50 dark:border-purple-800/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                      <div className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wider">Weighted GPA</div>
                      <div className="text-2xl font-bold text-purple-800 dark:text-purple-200 mt-1">{termStats.weightedDisplay.toFixed(2)}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-950/40 dark:to-orange-950/30 
                                  border border-amber-100/50 dark:border-amber-800/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                      <div className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider">Average (unweighted)</div>
                      <div className="text-2xl font-bold text-amber-800 dark:text-amber-200 mt-1">{termStats.avgDisplay.toFixed(2)}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50/80 to-sky-50/60 dark:from-cyan-950/40 dark:to-sky-950/30 
                                  border border-cyan-100/50 dark:border-cyan-800/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                      <div className="text-xs text-cyan-600 dark:text-cyan-400 font-medium uppercase tracking-wider">Median</div>
                      <div className="text-2xl font-bold text-cyan-800 dark:text-cyan-200 mt-1">{termStats.medianDisplay.toFixed(2)}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/80 to-pink-50/60 dark:from-rose-950/40 dark:to-pink-950/30 
                                  border border-rose-100/50 dark:border-rose-800/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                      <div className="text-xs text-rose-600 dark:text-rose-400 font-medium uppercase tracking-wider">Best / Worst</div>
                      <div className="text-2xl font-bold text-rose-800 dark:text-rose-200 mt-1">{termStats.bestDisplay.toFixed(2)} / {termStats.worstDisplay.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  {/* Enhanced chart section */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-50/50 to-gray-100/30 dark:from-gray-800/50 dark:to-gray-900/30 
                                border border-gray-200/50 dark:border-gray-700/30 shadow-lg backdrop-blur-sm">
                    <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Grade Distribution Chart</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={gradeDist}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill={COLORS[2]} radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Enhanced courses table */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-white/80 to-gray-50/60 dark:from-gray-800/80 dark:to-gray-900/60 
                                border border-gray-200/50 dark:border-gray-700/30 shadow-lg backdrop-blur-sm">
                    <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Course Details</h4>
                    <div className={`overflow-auto max-h-80 rounded-xl border border-gray-200/50 dark:border-gray-700/30 ${scrollbarClass}`}>
                      <table className="min-w-full text-sm">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gradient-to-r from-gray-100/90 to-gray-200/80 dark:from-gray-700/90 dark:to-gray-800/80 text-gray-700 dark:text-gray-300 backdrop-blur-sm">
                            <th className="text-left p-3 font-semibold tracking-wide">Code</th>
                            <th className="text-left p-3 font-semibold tracking-wide">Course</th>
                            <th className="text-left p-3 font-semibold tracking-wide">Credits</th>
                            <th className="text-left p-3 font-semibold tracking-wide">GPA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {termStats.coursesSorted.map((c, index) => {
                            const g = Math.max(0, Math.min(4, (c.gpa as number)));
                            const display = gpaScale === '1-highest' ? (5 - g) : g;
                            return (
                              <tr key={c.id} className={`border-t border-gray-200/30 dark:border-gray-700/30 
                                                        hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/20 
                                                        dark:hover:from-blue-950/20 dark:hover:to-purple-950/10 
                                                        transition-all duration-200 ${index % 2 === 0 ? 'bg-white/30 dark:bg-gray-800/30' : 'bg-gray-50/30 dark:bg-gray-900/30'}`}>
                                <td className="p-3 whitespace-nowrap font-medium text-gray-700 dark:text-gray-300">{c.code || '-'}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-200">{c.name || '-'}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{Number(c.credits) || 0}</td>
                                <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{display.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                          {termStats.coursesSorted.length === 0 && (
                            <tr><td className="p-4 text-gray-500 dark:text-gray-400 text-center italic" colSpan={4}>No courses with GPA yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex-shrink-0 pt-6 border-t border-gray-200/30 dark:border-gray-700/30 mt-4">
                <Button 
                  variant="outline" 
                  className="rounded-2xl border-2 bg-gradient-to-r from-white/90 to-gray-50/80 dark:from-gray-800/90 dark:to-gray-900/80 
                           backdrop-blur-md hover:from-red-50/90 hover:to-pink-50/80 dark:hover:from-red-950/40 dark:hover:to-pink-950/30 
                           border-gray-200/60 dark:border-gray-600/40 hover:border-red-200/60 dark:hover:border-red-400/30
                           shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95
                           text-gray-700 dark:text-gray-200 hover:text-red-700 dark:hover:text-red-300
                           font-medium tracking-wide px-6 py-2" 
                  onClick={() => setGradesOpen(false)}
                >
                  <span className="relative z-10">Close</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* All‑tabs Summary (clickable previews) */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight mb-4">Everything in one place</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <Feature
                icon={School}
                title="Academic Planner"
                desc="Program map by SY & term, courses, sections, units, GPA."
                cta="Open Academic Planner"
                colors={COLORS}
                iconType="academic"
                onClick={
                  navigate
                    ? () => navigate("/planner")
                    : () => (window.location.href = "/planner")
                }
              />
              <Feature 
                icon={ClipboardList} 
                title="Task Tracker" 
                desc="Assignments by course with status, due date/time, days‑left, grade + completion chart." 
                cta="Track Tasks" 
                colors={COLORS} 
                iconType="productivity"
                onClick={() => navigate("/tasks")} 
              />
              <Feature 
                icon={CalendarDays} 
                title="Schedule Planner" 
                desc="Sunday–Saturday timetable with focus blocks & time usage." 
                cta="Plan My Week" 
                colors={COLORS}
                iconType="navigation"
                onClick={
                  navigate
                    ? () => navigate("/schedule")
                    : () => (window.location.href = "/schedule")
                }
              />              
              <Feature 
                icon={BookOpenCheck} 
                title="Course Planner" 
                desc="Instructor, time, room, syllabus, meetings/week, weighted grading, projects, notes & study plan." 
                cta="Open Course Planner" 
                colors={COLORS}
                iconType="academic"
                onClick={() => navigate("/courses")}
              />
              <Feature 
                icon={Wallet} 
                title="Scholarship Tracker" 
                desc="Status, deadlines, days‑left, submitted docs, awards with charts." 
                cta="Track Scholarships"  
                colors={COLORS} 
                iconType="primary"
                onClick={() => navigate("/scholarships")} 
              />
              <Feature 
                icon={BookMarked} 
                title="Textbook Tracker" 
                desc="Per‑class texts, publisher, status, purchase & return dates." 
                cta="Log Textbooks" 
                colors={COLORS} 
                iconType="feature"
                onClick={() => navigate("/textbooks")} 
              />
              <Feature 
                icon={Settings} 
                title="Settings" 
                desc="Themes, notifications, data import/export, grading scales, calendar sync, time format." 
                cta="Open Settings" 
                colors={COLORS} 
                iconType="navigation"
                onClick={() => navigate("/settings")} 
              />
            </div>
          </div>

          {/* Gamification strip */}
          <div className="mt-12">
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 ">
                  <div>
                    <h3 className="text-xl font-semibold ">Level up your semester</h3>
                    <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
                      Earn streaks for consistent study, unlock badges (First A, 10 tasks done, No‑Overdue Week), and upgrade your Academic Avatar.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      className="rounded-2xl bg-gradient-to-r from-purple-600/90 to-violet-600/90 dark:from-purple-500/90 dark:to-violet-500/90
                                hover:from-purple-700/95 hover:to-violet-700/95 dark:hover:from-purple-400/95 dark:hover:to-violet-400/95
                                text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                                hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                                font-medium tracking-wide backdrop-blur-md
                                ring-2 ring-purple-200/50 dark:ring-purple-400/30 hover:ring-purple-300/60 dark:hover:ring-purple-300/40"
                      onClick={() => { setGamificationTab('quests'); setGamificationOpen(true); }}
                    >
                      Start Daily Quest
                    </Button>
                    <Button 
                      variant="outline" 
                      className="rounded-2xl border-2 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/90 dark:to-neutral-900/80 
                               backdrop-blur-md hover:from-purple-50/90 hover:to-violet-50/80 dark:hover:from-purple-950/40 dark:hover:to-violet-950/30 
                               border-neutral-200/60 dark:border-neutral-600/40 hover:border-purple-200/60 dark:hover:border-violet-400/30
                               shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95
                               text-neutral-700 dark:text-neutral-200 hover:text-purple-700 dark:hover:text-violet-300
                               font-medium tracking-wide"
                      onClick={() => { setGamificationTab('badges'); setGamificationOpen(true); }}
                    >
                      <span>View Badges</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer tips */}
          <div className="flex flex-wrap gap-3 items-center justify-between mt-8 pb-6">
            <p className="text-xs text-neutral-500">Tip: Import syllabi or connect a calendar to auto‑create tasks & classes.</p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="rounded-2xl border-2 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/90 dark:to-neutral-900/80 
                         backdrop-blur-md hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 
                         border-neutral-200/60 dark:border-neutral-600/40 hover:border-blue-200/60 dark:hover:border-indigo-400/30
                         shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95
                         text-neutral-700 dark:text-neutral-200 hover:text-blue-700 dark:hover:text-indigo-300
                         font-medium tracking-wide"
                onClick={() => {
                  const subject = encodeURIComponent('AcademicQuest Feedback');
                  const body = encodeURIComponent('Hi! I would like to share feedback about AcademicQuest:\n\n[Please describe your experience, suggestions, or any errors encountered]\n\nThank you!');
                  window.open(`mailto:renkai.studios0@gmail.com?subject=${subject}&body=${body}`, '_blank');
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                <span>Send Feedback</span>
              </Button>
              <Button 
                className="rounded-2xl bg-gradient-to-r from-green-600/90 to-emerald-600/90 dark:from-green-500/90 dark:to-emerald-500/90
                          hover:from-green-700/95 hover:to-emerald-700/95 dark:hover:from-green-400/95 dark:hover:to-emerald-400/95
                          text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                          hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                          font-medium tracking-wide backdrop-blur-md
                          ring-2 ring-green-200/50 dark:ring-green-400/30 hover:ring-green-300/60 dark:hover:ring-green-300/40"
                onClick={() => navigate("/planner")}
              >
                Add Course
              </Button>
            </div>
          </div>
        </div>

          {/* Quick Add Task dialog */}
          <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
            <DialogContent className="max-w-lg border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 
                                    dark:from-neutral-900/95 dark:via-neutral-900/90 dark:to-neutral-800/85 backdrop-blur-md
                                    ring-1 ring-white/20 dark:ring-white/10">
              <DialogHeader className="pb-4 border-b border-gray-200/30 dark:border-gray-700/30">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 
                                      dark:from-blue-400 dark:via-purple-400 dark:to-blue-300 bg-clip-text text-transparent
                                      flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 
                                border border-blue-100/50 dark:border-blue-800/30 shadow-lg">
                    <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Quick Add Task
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></span>
                    Task Title
                  </label>
                  <Input 
                    value={qTitle} 
                    onChange={(e) => setQTitle(e.target.value)} 
                    placeholder="e.g., OS Lab Report, Assignment 3, Project Submission..." 
                    className="rounded-xl border-2 border-gray-200/60 dark:border-gray-600/40 
                             bg-gradient-to-r from-white/90 to-gray-50/80 dark:from-gray-800/90 dark:to-gray-900/80
                             backdrop-blur-md focus:border-blue-400/60 dark:focus:border-purple-400/60
                             focus:ring-4 focus:ring-blue-100/50 dark:focus:ring-purple-900/30
                             transition-all duration-300 hover:shadow-lg focus:shadow-xl
                             text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400
                             h-11 px-4"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></span>
                      Due Date
                    </label>
                    <Input 
                      type="date" 
                      value={qDate} 
                      onChange={(e) => setQDate(e.target.value)} 
                      className="rounded-xl border-2 border-gray-200/60 dark:border-gray-600/40 
                               bg-gradient-to-r from-white/90 to-gray-50/80 dark:from-gray-800/90 dark:to-gray-900/80
                               backdrop-blur-md focus:border-emerald-400/60 dark:focus:border-teal-400/60
                               focus:ring-4 focus:ring-emerald-100/50 dark:focus:ring-teal-900/30
                               transition-all duration-300 hover:shadow-lg focus:shadow-xl
                               text-gray-800 dark:text-gray-200 h-11 px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></span>
                      Due Time
                    </label>
                    <Input 
                      type="time" 
                      value={qTime} 
                      onChange={(e) => setQTime(e.target.value)} 
                      className="rounded-xl border-2 border-gray-200/60 dark:border-gray-600/40 
                               bg-gradient-to-r from-white/90 to-gray-50/80 dark:from-gray-800/90 dark:to-gray-900/80
                               backdrop-blur-md focus:border-amber-400/60 dark:focus:border-orange-400/60
                               focus:ring-4 focus:ring-amber-100/50 dark:focus:ring-orange-900/30
                               transition-all duration-300 hover:shadow-lg focus:shadow-xl
                               text-gray-800 dark:text-gray-200 h-11 px-4"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></span>
                    Status
                  </label>
                  <select 
                    className="w-full h-11 px-4 rounded-xl border-2 border-gray-200/60 dark:border-gray-600/40 
                             bg-gradient-to-r from-white/90 to-gray-50/80 dark:from-gray-800/90 dark:to-gray-900/80
                             backdrop-blur-md focus:border-purple-400/60 dark:focus:border-pink-400/60
                             focus:ring-4 focus:ring-purple-100/50 dark:focus:ring-pink-900/30
                             transition-all duration-300 hover:shadow-lg focus:shadow-xl
                             text-gray-800 dark:text-gray-200 cursor-pointer
                             focus:outline-none appearance-none"
                    value={qStatus} 
                    onChange={(e)=> setQStatus(e.target.value as "Not Started"|"In Progress"|"Completed")}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="Not Started">🔄 Not Started</option>
                    <option value="In Progress">⚡ In Progress</option>
                    <option value="Completed">✅ Completed</option>
                  </select>
                </div>
              </div>
              
              <DialogFooter className="pt-6 border-t border-gray-200/30 dark:border-gray-700/30 gap-3">
                <Button 
                  variant="outline" 
                  className="rounded-2xl border-2 bg-gradient-to-r from-white/90 to-gray-50/80 dark:from-gray-800/90 dark:to-gray-900/80 
                           backdrop-blur-md hover:from-red-50/90 hover:to-pink-50/80 dark:hover:from-red-950/40 dark:hover:to-pink-950/30 
                           border-gray-200/60 dark:border-gray-600/40 hover:border-red-200/60 dark:hover:border-red-400/30
                           shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95
                           text-gray-700 dark:text-gray-200 hover:text-red-700 dark:hover:text-red-300
                           font-medium tracking-wide px-6 py-2 flex-1" 
                  onClick={() => setQuickOpen(false)}
                >
                  <span className="relative z-10">Cancel</span>
                </Button>
                <Button 
                  className="rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 
                           dark:from-blue-500 dark:via-purple-500 dark:to-blue-600
                           hover:from-blue-700 hover:via-purple-700 hover:to-blue-800
                           dark:hover:from-blue-600 dark:hover:via-purple-600 dark:hover:to-blue-700
                           shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95
                           text-white font-medium tracking-wide px-6 py-2 flex-1
                           border-0 ring-2 ring-blue-200/50 dark:ring-purple-400/30"
                  onClick={commitQuickTask}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>Add Task</span>
                    <span className="text-lg">✨</span>
                  </span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Badges modal (simple inline) */}
        <AnimatePresence>
          {showBadges && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setShowBadges(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-[92%] max-w-lg rounded-3xl shadow-2xl bg-white/90 dark:bg-neutral-900/90 border border-black/10 dark:border-white/10 backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Unlocked Badges</h4>
                  <Button size="sm" variant="ghost" className="rounded-2xl bg-transparent text-foreground hover:bg-black/5 dark:hover:bg-white/80 dark:bg-neutral-900/60 border-0 shadow-none focus-visible:outline-none focus-visible:ring-0" onClick={() => setShowBadges(false)}>Close</Button>
                </div>
                <div className="p-6 grid grid-cols-3 gap-4">
                  {[
                    { name: "First A", icon: Star },
                    { name: "10 Tasks", icon: Trophy },
                    { name: "No‑Overdue Week", icon: Sparkles },
                  ].map(({ name, icon: Icon }, idx) => (
                    <div key={idx} className="text-center">
                      <div className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center bg-neutral-50 dark:bg-neutral-800/60">
                        <Icon className="h-6 w-6" />
                      </div>
                      <p className="text-xs mt-2 font-medium">{name}</p>
                    </div>
                  ))}
                </div>
                <div className="px-6 pb-6">
                  <Button className="w-full rounded-2xl">See All Badges</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Study Hours Panel */}
        <StudyHoursPanel 
          isOpen={studyHoursOpen} 
          onClose={() => setStudyHoursOpen(false)} 
        />

        {/* Gamification Panel */}
        <GamificationPanel 
          isOpen={gamificationOpen} 
          onClose={() => setGamificationOpen(false)}
          defaultTab={gamificationTab}
        />

        {/* Attendance Dialog */}
        <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
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
                Mark Attendance
              </DialogTitle>
            </DialogHeader>
            
            {selectedScheduleItem && (
              <div className="py-6">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-white/80 to-gray-50/60 dark:from-gray-800/80 dark:to-gray-900/60 
                             border border-gray-200/50 dark:border-gray-700/30 shadow-lg backdrop-blur-sm">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                      {selectedScheduleItem.course}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/30 
                                     border border-blue-100/50 dark:border-blue-800/30">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium">{selectedScheduleItem.time}</span>
                      </span>
                      {selectedScheduleItem.room && (
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50/80 dark:bg-emerald-950/30 
                                       border border-emerald-100/50 dark:border-emerald-800/30">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-medium">{selectedScheduleItem.room}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Did you attend this class today?
                    </p>
                    
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700
                                 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600
                                 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                                 hover:scale-105 active:scale-95 font-medium py-3"
                        onClick={() => handleMarkAttendance(true)}
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Yes, I Attended
                      </Button>
                      <Button
                        className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700
                                 dark:from-red-500 dark:to-rose-500 dark:hover:from-red-600 dark:hover:to-rose-600
                                 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                                 hover:scale-105 active:scale-95 font-medium py-3"
                        onClick={() => handleMarkAttendance(false)}
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        No, I Missed It
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="pt-6 border-t border-gray-200/30 dark:border-gray-700/30">
              <Button 
                variant="outline" 
                className="rounded-2xl border-2 bg-gradient-to-r from-white/90 to-gray-50/80 dark:from-gray-800/90 dark:to-gray-900/80 
                         backdrop-blur-md hover:from-red-50/90 hover:to-pink-50/80 dark:hover:from-red-950/40 dark:hover:to-pink-950/30 
                         border-gray-200/60 dark:border-gray-600/40 hover:border-red-200/60 dark:hover:border-red-400/30
                         shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95
                         text-gray-700 dark:text-gray-200 hover:text-red-700 dark:hover:text-red-300
                         font-medium tracking-wide px-6 py-2" 
                onClick={() => setAttendanceDialogOpen(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
