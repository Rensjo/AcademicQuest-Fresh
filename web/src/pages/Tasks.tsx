import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Plus, Trash2, Clock } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useAcademicPlan } from "@/store/academicPlanStore";
import { useTasksStore, tasksByTerm, AQTask, TaskStatus } from "@/store/tasksStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTheme, PALETTES } from "@/store/theme";
import TopTabsInline from "@/components/TopTabsInline";

// Using global AQTask from tasks store

// ---------- Gradient background (match Dashboard/Planner/Schedule) ----------
function useThemedGradient() {
  const theme = useTheme();
  const THEME_COLORS = PALETTES[theme.palette];
  const [accentLocal, setAccentLocal] = React.useState(theme.accent);
  React.useEffect(() => setAccentLocal(theme.accent), [theme.accent]);

  return React.useMemo(() => {
    const alpha = Math.min(0.35, Math.max(0.12, (accentLocal as number) / 260));
    const hex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme.mode === "dark" || (theme.mode === "system" && prefersDark);
    const base = isDark
      ? "linear-gradient(135deg, #0b0f19 0%, #0a0a0a 70%)"
      : "linear-gradient(135deg, #ffffff 0%, #f8fbff 65%)";
    const tintA = `radial-gradient(circle at 8% 0%, ${THEME_COLORS[0]}${hex} 0%, transparent 40%)`;
    const tintB = `radial-gradient(circle at 92% 12%, ${THEME_COLORS[3]}${hex} 0%, transparent 45%)`;
    const tintC = `radial-gradient(circle at 50% 120%, ${THEME_COLORS[2]}${hex} 0%, transparent 55%)`;
    return {
      backgroundImage: `${tintA}, ${tintB}, ${tintC}, ${base}`,
      backgroundRepeat: "no-repeat, no-repeat, no-repeat, no-repeat",
      backgroundAttachment: "fixed, fixed, scroll, fixed",
      backgroundPosition: "8% 0%, 92% 12%, 50% 100%, 0 0",
    } as React.CSSProperties;
  }, [accentLocal, theme.mode, THEME_COLORS]);
}

export default function Tasks() {
  const gradientStyle = useThemedGradient();
  // Pull academic plan data
  const years = useAcademicPlan((s) => s.years);
  const selectedYearId = useAcademicPlan((s) => s.selectedYearId);

  // Active selection (default to first year/term)
  const [activeYearId, setActiveYearId] = React.useState<string | undefined>(() => selectedYearId || years[0]?.id);
  const [activeTermId, setActiveTermId] = React.useState<string | undefined>(() => years[0]?.terms[0]?.id);

  // Keep active ids valid when plan changes
  React.useEffect(() => {
    if (!years.length) return;
    const year = years.find((y) => y.id === activeYearId) || years[0];
    const term = year.terms.find((t) => t.id === activeTermId) || year.terms[0];
    if (year.id !== activeYearId) setActiveYearId(year.id);
    if (term?.id !== activeTermId) setActiveTermId(term?.id);
  }, [years, activeYearId, activeTermId]);

  const activeYear = React.useMemo(() => years.find((y) => y.id === activeYearId), [years, activeYearId]);
  const activeTerm = React.useMemo(() => activeYear?.terms.find((t) => t.id === activeTermId), [activeYear, activeTermId]);
  const termCourses = React.useMemo(() => (activeTerm?.courses || []).filter((c) => (c.code?.trim() || c.name?.trim())), [activeTerm]);

  // Simplified course lookup - use course.id as the Select value for consistency
  const getCourseByCourseId = React.useCallback((courseId?: string) => {
    if (!courseId) return null;
    
    // First try to find by the courseId directly (should be course.id)
    let course = termCourses.find(c => c.id === courseId);
    
    // Fallback: try to find by code (uppercase) for backward compatibility
    if (!course) {
      course = termCourses.find(c => c.code?.trim().toUpperCase() === courseId.toUpperCase());
    }
    
    // Final fallback: try to find by name
    if (!course) {
      course = termCourses.find(c => c.name?.trim() === courseId);
    }
    
    return course;
  }, [termCourses]);

  // Helper to format course display (optimized for smaller width)
  const formatCourseDisplay = React.useCallback((course: { code?: string; name?: string }) => {
    const code = course.code?.trim();
    const name = course.name?.trim();
    
    // For smaller column, prioritize course code and limit name length
    if (code && name) {
      // If name is short, show both. If long, truncate name or show code only
      if (name.length <= 15) {
        return `${code} — ${name}`;
      } else {
        return `${code} — ${name.substring(0, 12)}...`;
      }
    }
    return code || name || 'Untitled';
  }, []);

  // Global tasks store
  const tasks = useTasksStore((s) => s.tasks);
  const addTask = useTasksStore((s) => s.addTask);
  const updateTask = useTasksStore((s) => s.updateTask);
  const removeTask = useTasksStore((s) => s.removeTask);

  // Active-term tasks from store
  const termKey = activeYear && activeTerm ? `${activeYear.id}:${activeTerm.id}` : "";
  const termTasks: AQTask[] = React.useMemo(() => tasksByTerm(tasks, activeYearId, activeTermId), [tasks, activeYearId, activeTermId]);

  // Sorting state
  const [sortByDeadline, setSortByDeadline] = React.useState(false);

  // Placeholder handling (for reaching 20 rows visually)
  const placeholderCount = Math.max(0, 20 - termTasks.length);
  const [spawned, setSpawned] = React.useState<Set<string>>(new Set());
  React.useEffect(() => { setSpawned(new Set()); }, [termKey]);

  function spawnFromPlaceholder(phKey: string, patch: Partial<AQTask>) {
    if (!activeYear || !activeTerm) return;
    if (spawned.has(phKey)) return;
    const base: AQTask = {
      id: crypto.randomUUID(),
      yearId: activeYear.id,
      termId: activeTerm.id,
      courseId: patch.courseId,
      title: patch.title || "",
      status: patch.status || "Not Started",
      dueDate: patch.dueDate,
      dueTime: patch.dueTime,
      grade: patch.grade,
    };
    addTask(base);
    const next = new Set(spawned);
    next.add(phKey);
    setSpawned(next);
  }

  type PlaceholderRow = { id: string; courseId?: string; title: string; status: TaskStatus; dueDate?: string; dueTime?: string; grade?: string };
  const placeholders: PlaceholderRow[] = React.useMemo(
    () => Array.from({ length: placeholderCount }).map((_, i) => ({ id: `ph:${i}`, courseId: "", title: "", status: "Not Started", dueDate: "", dueTime: "", grade: "" })),
    [placeholderCount]
  );
  const displayRows: (AQTask | PlaceholderRow)[] = React.useMemo(() => {
    const sortedTasks = [...termTasks];
    
    if (sortByDeadline) {
      // Sort by days left: closest deadline first
      sortedTasks.sort((a, b) => {
        const daysA = getDaysLeft(a.dueDate);
        const daysB = getDaysLeft(b.dueDate);
        
        // Handle undefined dates (tasks without due dates go to end)
        if (daysA === undefined && daysB === undefined) return 0;
        if (daysA === undefined) return 1;
        if (daysB === undefined) return -1;
        
        // Sort by days left (closest deadline first)
        const daysDiff = daysA - daysB;
        if (daysDiff !== 0) return daysDiff;
        
        // If same days left, prioritize by status (Not Started and In Progress first)
        const statusPriority = { "Not Started": 0, "In Progress": 1, "Completed": 2 };
        return statusPriority[a.status] - statusPriority[b.status];
      });
    }
    
    return [...sortedTasks, ...placeholders];
  }, [termTasks, placeholders, sortByDeadline]);

  // Only consider "filled" tasks (non-empty title)
  const filled = termTasks.filter(r => (r.title?.trim()?.length ?? 0) > 0);
  const completed = filled.filter(r => r.status === "Completed").length;
  const pct = filled.length ? Math.round((completed / filled.length) * 100) : 0;

  // Donut chart data
  const donut = [
    { name: "done", value: pct },
    { name: "left", value: 100 - pct },
  ];

  function addRow() {
    if (!activeYear || !activeTerm) return;
    addTask({ id: crypto.randomUUID(), yearId: activeYear.id, termId: activeTerm.id, courseId: "", title: "", status: "Not Started", dueDate: undefined, dueTime: undefined, grade: undefined });
  }

  // Term/Yr selection dialog
  const [termDialogOpen, setTermDialogOpen] = React.useState(false);
  
  function selectYearTerm(yId: string, tId: string) {
    setActiveYearId(yId);
    setActiveTermId(tId);
    setTermDialogOpen(false);
  }

  // Days-left helper (calendar days difference, ignoring time)
  function getDaysLeft(dueDate?: string): number | undefined {
    if (!dueDate) return undefined;
    const today = new Date();
    const d0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const due = new Date(dueDate);
    const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diff = (d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24);
    return Math.round(diff);
  }

  return (
    <div className="min-h-screen w-full" style={gradientStyle}>
      <div className="max-w-[1400px] mx-auto px-4 py-7 space-y-6">
        {/* Header: title on first row, tabs on second; donut on right */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5" />
              <h1 className="text-2xl font-bold">Task Tracker</h1>
            </div>
            <div className="mt-2 min-w-0">
              <TopTabsInline active="tasks" />
            </div>
          </div>
          <Card className="shrink-0 border-0 shadow-xl rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl 
                          ring-1 ring-gray-200/50 dark:ring-gray-600/50 w-[176px] sm:w-[200px] md:w-[220px] 
                          hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-3 sm:p-3 md:p-4">
              <div className="h-28 sm:h-28 md:h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie dataKey="value" data={donut} innerRadius={36} outerRadius={48} startAngle={90} endAngle={-270} paddingAngle={2} cornerRadius={3} stroke="transparent">
                      {donut.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "hsl(var(--primary))" : "#e5e7eb"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-sm mt-1 font-semibold text-gray-700 dark:text-gray-200">{pct}% Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Full-width task canvas */}
        <Card className="border-0 shadow-xl rounded-3xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl 
                        ring-1 ring-gray-200/50 dark:ring-gray-600/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r 
                                from-white/50 to-gray-50/30 dark:from-neutral-800/50 dark:to-neutral-900/30 backdrop-blur-md
                                border-b border-gray-200/60 dark:border-gray-600/40">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                {activeYear && activeTerm ? (
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{activeYear.label} • {activeTerm.name}</span>
                ) : (
                  <span className="font-semibold text-gray-800 dark:text-gray-100">Current Term</span>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
                <Button
                  variant="outline"
                  className="rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-gray-800/80 dark:to-gray-900/70 
                            text-gray-700 dark:text-gray-200 hover:from-cyan-50/90 hover:to-blue-50/80 dark:hover:from-cyan-950/40 dark:hover:to-blue-950/30 
                            hover:text-cyan-700 dark:hover:text-cyan-300 shadow-md hover:shadow-lg backdrop-blur-sm 
                            border border-gray-200/60 dark:border-gray-600/40 hover:border-cyan-200/60 dark:hover:border-cyan-400/30
                            transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0"
                  onClick={() => setTermDialogOpen(true)}
                >
                  {activeYear && activeTerm ? `${activeYear.label} • ${activeTerm.name}` : "Select Term"}
                </Button>
                <DialogContent className="max-w-md rounded-3xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-0 shadow-2xl 
                                          ring-1 ring-gray-200/50 dark:ring-gray-600/50">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">Select School Year • Term</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[60vh] overflow-auto">
                    {years.map((y) => (
                      <div key={y.id} className="rounded-2xl bg-gradient-to-r from-white/60 to-gray-50/40 dark:from-gray-800/60 dark:to-gray-900/40 
                                                backdrop-blur-md border border-gray-200/60 dark:border-gray-600/40 p-4 shadow-md">
                        <div className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">{y.label}</div>
                        <div className="flex flex-wrap gap-2">
                          {y.terms.map((t) => (
                            <Button 
                              key={t.id} 
                              variant={y.id === activeYearId && t.id === activeTermId ? 'default' : 'outline'} 
                              className={`rounded-2xl transition-all duration-300 font-medium tracking-wide
                                ${y.id === activeYearId && t.id === activeTermId 
                                  ? "bg-gradient-to-r from-cyan-600/90 to-blue-600/90 dark:from-cyan-500/90 dark:to-blue-500/90 text-white shadow-lg ring-2 ring-cyan-200/50 dark:ring-cyan-400/30 backdrop-blur-md hover:from-cyan-700/95 hover:to-blue-700/95 dark:hover:from-cyan-400/95 dark:hover:to-blue-400/95" 
                                  : "bg-gradient-to-r from-white/80 to-gray-50/70 dark:from-gray-800/80 dark:to-gray-900/70 text-gray-700 dark:text-gray-200 hover:from-cyan-50/90 hover:to-blue-50/80 dark:hover:from-cyan-950/40 dark:hover:to-blue-950/30 hover:text-cyan-700 dark:hover:text-cyan-300 shadow-md hover:shadow-lg backdrop-blur-md border border-gray-200/60 dark:border-gray-600/40 hover:border-cyan-200/60 dark:hover:border-cyan-400/30"
                                }
                                hover:scale-102 active:scale-98 hover:-translate-y-0.5 active:translate-y-0`}
                              onClick={() => selectYearTerm(y.id, t.id)}
                            >
                              {t.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                size="sm" 
                className="rounded-2xl bg-gradient-to-r from-green-600/90 to-emerald-600/90 dark:from-green-500/90 dark:to-emerald-500/90 
                          text-white shadow-lg ring-2 ring-green-200/50 dark:ring-green-400/30 backdrop-blur-sm border-0
                          hover:from-green-700/95 hover:to-emerald-700/95 dark:hover:from-green-400/95 dark:hover:to-emerald-400/95
                          transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0 
                          font-medium tracking-wide" 
                onClick={addRow}
              >
                <Plus className="h-4 w-4 mr-1"/>Add Task
              </Button>
              <Button 
                size="sm" 
                variant={sortByDeadline ? "default" : "outline"}
                className={`rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0 
                          font-medium tracking-wide ${sortByDeadline 
                    ? "bg-gradient-to-r from-blue-600/90 to-indigo-600/90 dark:from-blue-500/90 dark:to-indigo-500/90 text-white shadow-lg ring-2 ring-blue-200/50 dark:ring-blue-400/30 backdrop-blur-sm border-0 hover:from-blue-700/95 hover:to-indigo-700/95 dark:hover:from-blue-400/95 dark:hover:to-indigo-400/95" 
                    : "bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 text-gray-700 dark:text-gray-200 hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 hover:text-blue-700 dark:hover:text-blue-300 shadow-md hover:shadow-lg backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/40 hover:border-blue-200/60 dark:hover:border-blue-400/30"
                  }`}
                onClick={() => setSortByDeadline(!sortByDeadline)}
                title={sortByDeadline ? "Disable deadline sorting" : "Sort by closest deadline"}
              >
                <Clock className="h-4 w-4 mr-1"/>
                {sortByDeadline ? "Sorted by Deadline" : "Sort by Deadline"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full overflow-x-auto rounded-2xl bg-gradient-to-r from-white/60 to-gray-50/40 dark:from-neutral-800/60 dark:to-neutral-900/40 
                          backdrop-blur-md border border-gray-200/60 dark:border-gray-600/40 shadow-lg">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gradient-to-r from-white/80 to-gray-50/60 dark:from-neutral-800/80 dark:to-neutral-900/60 
                                backdrop-blur-md border-b border-gray-200/60 dark:border-gray-600/40">
                  <tr className="text-left">
                    <th className="px-3 py-2 w-[120px] font-semibold text-gray-700 dark:text-gray-200">Course</th>
                    <th className="px-3 py-2 w-[420px] font-semibold text-gray-700 dark:text-gray-200">Assignment / To‑do</th>
                    <th className="px-3 py-2 w-[150px] font-semibold text-gray-700 dark:text-gray-200">Status</th>
                    <th className="px-3 py-2 w-[140px] font-semibold text-gray-700 dark:text-gray-200">Due Date</th>
                    <th className="px-3 py-2 w-[110px] font-semibold text-gray-700 dark:text-gray-200">Due Time</th>
                    <th className="px-3 py-2 w-[110px] font-semibold text-gray-700 dark:text-gray-200">Days Left</th>
                    <th className="px-3 py-2 w-[90px] font-semibold text-gray-700 dark:text-gray-200">Grade</th>
                    <th className="px-3 py-2 w-[50px] font-semibold text-gray-700 dark:text-gray-200"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((r) => (
                    <tr key={r.id} className="border-t border-gray-200/40 dark:border-gray-600/30 hover:bg-white/30 dark:hover:bg-neutral-700/20 transition-colors duration-200">
                      <td className="px-2 py-2 w-[120px] max-w-[120px] overflow-hidden">
                        <Select 
                          value={getCourseByCourseId(r.courseId)?.id || ""} 
                          onValueChange={(v) => {
                            if (typeof r.id === 'string' && r.id.startsWith('ph:')) {
                              spawnFromPlaceholder(r.id, { courseId: v });
                            } else {
                              updateTask(r.id as string, { courseId: v });
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 w-full rounded-lg bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
                                                   focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
                                                   transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs overflow-hidden">
                            <SelectValue placeholder="Select course">
                              {getCourseByCourseId(r.courseId) ? (
                                <span className="block truncate text-left overflow-hidden">{formatCourseDisplay(getCourseByCourseId(r.courseId)!)}</span>
                              ) : (
                                <span className="block truncate text-left text-gray-500 dark:text-gray-400">Select course</span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-0 shadow-2xl 
                                                   ring-1 ring-gray-200/50 dark:ring-gray-600/50">
                            {termCourses.length === 0 && (
                              <SelectItem value="__no_courses__" disabled>No courses</SelectItem>
                            )}
                            {termCourses.map((c) => (
                              <SelectItem 
                                key={c.id} 
                                value={c.id}
                                className="rounded-xl mx-1 my-0.5 focus:bg-cyan-50/90 dark:focus:bg-cyan-950/30 
                                          focus:text-cyan-700 dark:focus:text-cyan-300 cursor-pointer
                                          transition-all duration-200 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20"
                              >
                                <span className="block truncate">{formatCourseDisplay(c)}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-2">
                        <Input 
                          className="h-8 rounded-lg bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 
                                    focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
                                    transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs" 
                          value={r.title} 
                          onChange={(e) => {
                            const val = e.target.value;
                            if (typeof r.id === 'string' && r.id.startsWith('ph:')) {
                              spawnFromPlaceholder(r.id, { title: val });
                            } else {
                              updateTask(r.id as string, { title: val });
                            }
                          }} 
                          placeholder="Assignment title" 
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Select value={r.status} onValueChange={(v) => {
                          const st = v as TaskStatus;
                          if (typeof r.id === 'string' && r.id.startsWith('ph:')) {
                            spawnFromPlaceholder(r.id, { status: st });
                          } else {
                            updateTask(r.id as string, { status: st });
                          }
                        }}>
                          <SelectTrigger className="h-8 rounded-lg bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
                                                   focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
                                                   transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs">
                            <SelectValue placeholder="Status"/>
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-0 shadow-2xl 
                                                   ring-1 ring-gray-200/50 dark:ring-gray-600/50">
                            <SelectItem value="Not Started" className="rounded-xl mx-1 my-0.5 focus:bg-cyan-50/90 dark:focus:bg-cyan-950/30 
                                                                      focus:text-cyan-700 dark:focus:text-cyan-300 cursor-pointer
                                                                      transition-all duration-200 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20">Not Started</SelectItem>
                            <SelectItem value="In Progress" className="rounded-xl mx-1 my-0.5 focus:bg-cyan-50/90 dark:focus:bg-cyan-950/30 
                                                                     focus:text-cyan-700 dark:focus:text-cyan-300 cursor-pointer
                                                                     transition-all duration-200 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20">In Progress</SelectItem>
                            <SelectItem value="Completed" className="rounded-xl mx-1 my-0.5 focus:bg-cyan-50/90 dark:focus:bg-cyan-950/30 
                                                                    focus:text-cyan-700 dark:focus:text-cyan-300 cursor-pointer
                                                                    transition-all duration-200 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-2">
                        <Input 
                          className="h-8 rounded-lg bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 
                                    focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
                                    transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs" 
                          type="date" 
                          value={r.dueDate || ""} 
                          onChange={(e) => {
                            const val = e.target.value;
                            if (typeof r.id === 'string' && r.id.startsWith('ph:')) {
                              spawnFromPlaceholder(r.id, { dueDate: val });
                            } else {
                              updateTask(r.id as string, { dueDate: val });
                            }
                          }} 
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input 
                          className="h-8 rounded-lg bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 
                                    focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
                                    transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs" 
                          type="time" 
                          value={r.dueTime || ""} 
                          onChange={(e) => {
                            const val = e.target.value;
                            if (typeof r.id === 'string' && r.id.startsWith('ph:')) {
                              spawnFromPlaceholder(r.id, { dueTime: val });
                            } else {
                              updateTask(r.id as string, { dueTime: val });
                            }
                          }} 
                        />
                      </td>
                      <td className="px-2 py-2">
                        {(() => {
                          const d = getDaysLeft(r.dueDate);
                          if (d === undefined) return <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>;
                          const cls = d < 0 ? "text-red-500 font-semibold" : d === 0 ? "text-amber-600 font-semibold" : "text-gray-600 dark:text-gray-300";
                          return <span className={`${cls} text-xs`}>{d}d</span>;
                        })()}
                      </td>
                      <td className="px-2 py-2">
                        <Input 
                          className="h-8 rounded-lg bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 
                                    focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
                                    transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs" 
                          value={r.grade || ""} 
                          onChange={(e) => {
                            const val = e.target.value;
                            if (typeof r.id === 'string' && r.id.startsWith('ph:')) {
                              spawnFromPlaceholder(r.id, { grade: val });
                            } else {
                              updateTask(r.id as string, { grade: val });
                            }
                          }} 
                        />
                      </td>
                      <td className="px-2 py-2">
                        {/* Only show delete button for actual tasks, not placeholders, and only if task has content */}
                        {typeof r.id === 'string' && !r.id.startsWith('ph:') && (r.title?.trim() || r.courseId) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0 rounded-lg 
                                      text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400
                                      hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all duration-200
                                      focus:text-red-500 dark:focus:text-red-400"
                            onClick={() => removeTask(r.id as string)}
                            title="Delete task"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
