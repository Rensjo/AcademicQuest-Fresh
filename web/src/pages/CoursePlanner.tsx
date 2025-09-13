import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCoursePlanner } from "@/store/coursePlannerStore";
import { useSchedule } from "@/store/scheduleStore";
import { useAcademicPlan } from "@/store/academicPlanStore";
import { useTasksStore, AQTask, TaskStatus } from "@/store/tasksStore";
import RichTextEditor, { RichTextEditorHandle } from "@/components/RichTextEditor";
import { saveToOPFS, getOPFSFileURL } from "@/lib/opfs";
import { Plus, CalendarDays, Save as SaveIcon, BookOpen, User, ClipboardList, Trash2 } from "lucide-react";
// themed gradient like other pages
import { useTheme, PALETTES } from "@/store/theme";
import { useToast } from "@/hooks/use-toast";
import TopTabsInline from "@/components/TopTabsInline";

// week checkbox helper
const DAYS = ["S", "M", "T", "W", "Th", "F", "S2"] as const;

// Neutral scrollbar styles for light/dark
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

export default function CoursePlanner() {
  const { toast } = useToast();
  // local gradient background (copied pattern from other pages)
  const theme = useTheme();
  const gradientStyle = React.useMemo(() => {
    const COLORS = PALETTES[theme.palette];
    const alpha = Math.min(0.5, Math.max(0.0, theme.accent / 150));
    const hex = Math.round(alpha * 255).toString(16).padStart(2, "0");
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme.mode === 'dark' || (theme.mode === 'system' && systemDark);
    const baseLinear = isDark
      ? 'linear-gradient(135deg, #0b0f19 0%, #0a0a0a 70%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f8fbff 65%)';
    const tintA = `radial-gradient(circle at 10% 0%, ${COLORS[0]}${hex} 0%, transparent 40%)`;
    const tintB = `radial-gradient(circle at 90% 10%, ${COLORS[3]}${hex} 0%, transparent 45%)`;
    const tintC = `radial-gradient(circle at 50% 120%, ${COLORS[2]}${hex} 0%, transparent 55%)`;
    return {
      backgroundImage: `${tintA}, ${tintB}, ${tintC}, ${baseLinear}`,
      backgroundRepeat: 'no-repeat, no-repeat, no-repeat, no-repeat',
      backgroundAttachment: 'fixed, fixed, scroll, fixed',
      backgroundPosition: '10% 0%, 90% 10%, 50% 100%, 0 0',
    } as React.CSSProperties;
  }, [theme.accent, theme.mode, theme.palette]);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme.mode === 'dark' || (theme.mode === 'system' && prefersDark);
  // current year/term from schedule store for data sources
  const years = useSchedule((s) => s.years);
  const scheduleSelectedYearId = useSchedule((s) => s.selectedYearId);
  
  // Course Planner's own year/term selection (independent from schedule/academic planners)
  const coursePlannerSelectedYearId = useCoursePlanner((s) => s.selectedYearId);
  const coursePlannerSelectedTermId = useCoursePlanner((s) => s.selectedTermId);
  const setCourseplannerSelectedYear = useCoursePlanner((s) => s.setSelectedYear);
  const setCourseplannerSelectedTerm = useCoursePlanner((s) => s.setSelectedTerm);
  
  // Academic plan for cross-referencing courses
  const academicYears = useAcademicPlan((s) => s.years);
  const academicSelectedYearId = useAcademicPlan((s) => s.selectedYearId);
  
  // No explicit hydration flag; Zustand persist rehydrates synchronously enough for default UI.
  const hydrated = true;
  
  // Use Course Planner's own selection, fallback to schedule selection, then first available
  const activeYearId = coursePlannerSelectedYearId || scheduleSelectedYearId || years[0]?.id;
  const year = years.find((y) => y.id === activeYearId);
  const activeTerm = coursePlannerSelectedTermId 
    ? year?.terms?.find(t => t.id === coursePlannerSelectedTermId) 
    : year?.terms?.[0]; // fallback to first term

  // Get academic plan courses for the current term to cross-reference
  const academicYear = academicYears.find(y => y.id === (academicSelectedYearId || academicYears[0]?.id));

  // Global tasks store
  const tasks = useTasksStore((s) => s.tasks);
  const addGlobalTask = useTasksStore((s) => s.addTask);
  const updateGlobalTask = useTasksStore((s) => s.updateTask);
  const removeGlobalTask = useTasksStore((s) => s.removeTask);

  // Enhanced Add Task dialog state
  const [addTaskOpen, setAddTaskOpen] = React.useState(false);
  const [taskTitle, setTaskTitle] = React.useState("");
  const [taskDate, setTaskDate] = React.useState("");
  const [taskTime, setTaskTime] = React.useState("");
  const [taskStatus, setTaskStatus] = React.useState<TaskStatus>("Not Started");

  // Year/Term selection dialog state
  const [yearTermOpen, setYearTermOpen] = React.useState(false);

  // Ensure key is typed as YearTermKey for store function signatures (only once hydrated)
  const key = React.useMemo<import("@/store/coursePlannerStore").YearTermKey>(
    () => `${activeYearId || "y"}::${activeTerm?.id || "t"}` as import("@/store/coursePlannerStore").YearTermKey,
    [activeYearId, activeTerm?.id]
  );

  // course planner store
  const courses = useCoursePlanner((s) => s.byYearTerm[key] || []);
  const selectedCourseId = useCoursePlanner((s) => s.selectedCourseId);
  const setSelectedCourse = useCoursePlanner((s) => s.setSelectedCourse);
  const addCourse = useCoursePlanner((s) => s.addCourse);
  const updateCourse = useCoursePlanner((s) => s.updateCourse);
  const addModule = useCoursePlanner((s) => s.addModule);
  const updateModule = useCoursePlanner((s) => s.updateModule);
  const removeModule = useCoursePlanner((s) => s.removeModule);
  const ensureFolder = useCoursePlanner((s) => s.ensureFolder);
  const renameFolder = useCoursePlanner((s) => s.renameFolder);
  const addFileToFolder = useCoursePlanner((s) => s.addFileToFolder);
  const moveFile = useCoursePlanner((s) => s.moveFile);
  const updateWeeklyAttendance = useCoursePlanner((s) => s.updateWeeklyAttendance);
  const getWeeklyAttendance = useCoursePlanner((s) => s.getWeeklyAttendance);

  // Get current week key (YYYY-WW format)
  const getCurrentWeekKey = () => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
    return `${now.getFullYear()}-${String(weekNumber).padStart(2, '0')}`;
  };

  const currentWeekKey = getCurrentWeekKey();
  const currentCourse = courses.find(c => c.id === selectedCourseId);
  const weeklyAttendance = currentCourse ? getWeeklyAttendance(key, currentCourse.id, currentWeekKey) : Array.from({ length: 7 }, () => false);

  // Handle attendance checkbox changes
  const handleAttendanceChange = (dayIndex: number, checked: boolean) => {
    if (currentCourse) {
      updateWeeklyAttendance(key, currentCourse.id, currentWeekKey, dayIndex, checked);
    }
  };

  // ensure one demo course on first use
  React.useEffect(() => {
    if (!hydrated) return;
    // Initialize Course Planner's own year/term selection if not set
    if (!coursePlannerSelectedYearId && activeYearId) setCourseplannerSelectedYear(activeYearId);
    if (!coursePlannerSelectedTermId && activeTerm?.id) setCourseplannerSelectedTerm(activeTerm.id);
    
    if (!courses.length && activeYearId && activeTerm?.id) {
      const id = addCourse(key, { title: "Course Title", code: "" });
      setSelectedCourse(id);
    }
  }, [hydrated, courses.length, activeYearId, activeTerm?.id, addCourse, setSelectedCourse, key, coursePlannerSelectedYearId, coursePlannerSelectedTermId, setCourseplannerSelectedYear, setCourseplannerSelectedTerm]);

  const course = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Filter global tasks for current course - comprehensive matching across all systems
  const courseTasks = React.useMemo(() => {
    if (!course || !tasks || tasks.length === 0) {
      console.log('🔍 CoursePlanner: No course or no tasks', { course, tasksLength: tasks?.length || 0 });
      return [];
    }
    
    // Get all possible course identifiers for this course
    const courseIdentifiers = [
      course.code?.trim().toUpperCase(),
      course.code?.trim(),
      course.code?.trim().toLowerCase(),
      course.title?.trim(),
      course.id,
    ].filter(Boolean); // Remove empty/null values
    
    // Get academic courses for cross-referencing
    const academicCourses = academicYear?.terms?.[0]?.courses || [];
    
    // Also check if this course matches any academic plan courses
    const matchingAcademicCourse = academicCourses.find(ac => 
      (ac.code?.trim() && course.code?.trim() && ac.code.trim().toUpperCase() === course.code.trim().toUpperCase()) ||
      (ac.name?.trim() && course.title?.trim() && ac.name.trim() === course.title.trim())
    );
    
    if (matchingAcademicCourse) {
      courseIdentifiers.push(
        matchingAcademicCourse.code?.trim().toUpperCase(),
        matchingAcademicCourse.code?.trim(),
        matchingAcademicCourse.name?.trim(),
        matchingAcademicCourse.id
      );
    }
    
    // Remove duplicates and filter out empty values
    const uniqueIdentifiers = [...new Set(courseIdentifiers)].filter(Boolean);
    
    console.log('🔍 CoursePlanner Comprehensive Debug:', {
      course: { 
        id: course.id, 
        code: course.code, 
        title: course.title 
      },
      matchingAcademicCourse,
      uniqueIdentifiers,
      allTasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        courseId: t.courseId,
        yearId: t.yearId,
        termId: t.termId
      })),
      totalTasks: tasks.length
    });
    
    // Filter tasks that match any of the course identifiers
    const matchedTasks = tasks.filter(task => {
      if (!task.courseId) return false;
      
      // Check if task's courseId matches any of our course identifiers
      const matches = uniqueIdentifiers.some(identifier => {
        // Exact match
        if (task.courseId === identifier) return true;
        
        // Case-insensitive match
        if (task.courseId.toUpperCase() === identifier?.toUpperCase()) return true;
        
        return false;
      });
      
      if (matches) {
        console.log(`✅ Task matched: "${task.title}" (courseId: "${task.courseId}") matches course "${course.code || course.title}"`);
      }
      
      return matches;
    });
    
    console.log(`🎯 Found ${matchedTasks.length} tasks for course "${course.code || course.title}":`, matchedTasks);
    return matchedTasks;
  }, [tasks, course, academicYear]);

  // Add task function
  const commitAddTask = () => {
    if (!taskTitle.trim() || !activeYearId || !activeTerm?.id || !course?.id) {
      setAddTaskOpen(false);
      return;
    }

    // Use course code as courseId for consistency, fallback to title, then ID
    const courseId = course.code?.trim().toUpperCase() || course.title?.trim() || course.id;

    console.log('➕ Adding task from Course Planner:', {
      courseId,
      course: { code: course.code, title: course.title, id: course.id },
      task: taskTitle.trim()
    });

    const newTask: AQTask = {
      id: crypto.randomUUID(),
      yearId: activeYearId,
      termId: activeTerm.id,
      courseId: courseId,
      title: taskTitle.trim(),
      status: taskStatus,
      dueDate: taskDate || undefined,
      dueTime: taskTime || undefined,
      grade: undefined,
    };

    addGlobalTask(newTask);
    
    // Reset form
    setTaskTitle("");
    setTaskDate("");
    setTaskTime("");
    setTaskStatus("Not Started");
    setAddTaskOpen(false);
    
    toast({
      title: "Task Added",
      description: `Added "${taskTitle.trim()}" to ${course.code || course.title}`,
    });
  };

  // ------- auto-sync Class Time + Room from Schedule Planner -------
  const scheduleTerm = activeTerm;
  // Live sync: if Course code/title matches a slot, use its time/room; 
  // if a slot is chosen once, remember by id for stability until data changes.
  const classMeta = React.useMemo((): { time: string; room: string; slotId?: string } => {
    if (!course || !scheduleTerm) return { time: "—", room: "—" };
    const norm = (s?: string) => (s || "").trim().toLowerCase();
    const byId = course.linkedSlotId ? scheduleTerm.slots.find((s) => s.id === course.linkedSlotId) : undefined;
    const byCode = scheduleTerm.slots.find((s) => s.courseCode && norm(s.courseCode) === norm(course.code));
    const byTitle = scheduleTerm.slots.find((s) => course.title && s.title && norm(s.title) === norm(course.title));
    const match = byId || byCode || byTitle;
    return match
      ? { time: `${match.start}–${match.end}`, room: match.room || "—", slotId: match.id }
      : { time: "—", room: "—", slotId: undefined };
  }, [course, scheduleTerm]);

  // Persist a stable link when we find a match; avoid loops by only setting when changed
  React.useEffect(() => {
    if (!course) return;
  const slotId = classMeta.slotId;
    if (slotId && course.linkedSlotId !== slotId) {
      updateCourse(key, { ...course, linkedSlotId: slotId });
    }
    if (!slotId && course.linkedSlotId) {
      // If the current course has a stale link that no longer exists in this term, clear it
      const exists = scheduleTerm?.slots.some(s => s.id === course.linkedSlotId);
      if (!exists) updateCourse(key, { ...course, linkedSlotId: undefined });
    }
  }, [classMeta, course, key, updateCourse, scheduleTerm]);

  // modules UI state
  const [activeModuleId, setActiveModuleId] = React.useState<string | undefined>(course?.modules?.[0]?.id);
  const editorRef = React.useRef<RichTextEditorHandle | null>(null);
  // Delete confirmation dialog state
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<{ id: string; title: string } | null>(null);
  const [confirmText, setConfirmText] = React.useState("");
  // Track module list by a stable key to avoid effect churn on content edits
  const modulesList = course?.modules;
  React.useEffect(() => {
    const ids = modulesList?.map((m) => m.id) ?? [];
    if (ids.length === 0) return;
    if (!activeModuleId || !ids.includes(activeModuleId)) {
      setActiveModuleId(ids[0]);
    }
  }, [modulesList, activeModuleId]);

  // file uploading
  const onUpload = async (path: string, files: FileList | null) => {
    if (!files || !course) return;
    for (const f of Array.from(files)) {
      const opfsPath = `AQ/Courses/${activeYearId}/${activeTerm?.id}/${course.id}/${path}/${f.name}`;
      const res = await saveToOPFS(opfsPath, f);
      addFileToFolder(key, course.id, path, {
        id: Math.random().toString(36).slice(2, 8),
        name: f.name,
        size: f.size,
        // If OPFS available and write succeeded, keep path; if fallback to URL, store URL
        opfsPath: res.ok && !("url" in res) ? opfsPath : undefined,
        url: res.ok && ("url" in res) ? res.url : undefined,
      });
    }
  };

  // Course Files UI state
  const [uploadTo, setUploadTo] = React.useState<string>("root");
  const [newFolder, setNewFolder] = React.useState("");
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameText, setRenameText] = React.useState("");

  React.useEffect(() => {
    if (!course) return;
    // Ensure root exists and keep upload target valid
    ensureFolder(key, course.id, "root");
    const paths = new Set(course.folders.map(f => f.path));
    if (!paths.has(uploadTo)) setUploadTo("root");
  }, [course, key, ensureFolder, uploadTo]);

  const handleAddFolder = () => {
    if (!course) return;
    const name = newFolder.trim();
    if (!name) return;
    // simple: treat name as a path segment under root; allow nested paths too
    ensureFolder(key, course.id, name);
    setNewFolder("");
  };

  const openFile = async (f: { url?: string; opfsPath?: string; name: string }) => {
    try {
      const href = f.url || (f.opfsPath ? await getOPFSFileURL(f.opfsPath) : undefined);
      if (!href) return;
      const a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.download = f.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (!f.url) setTimeout(() => URL.revokeObjectURL(href), 1500);
    } catch {
      /* ignore */
    }
  };

  // Root folder is created when adding a course; no-op here to avoid needless writes

  const onSaveModuleNotes = React.useCallback(async () => {
    if (!course || !activeModuleId) return;
    const mod = course.modules.find((m) => m.id === activeModuleId);
    if (!mod) return;
    // Always fetch the latest HTML from the live editor (in case user typed but state not yet flushed)
    const liveHtml = editorRef.current?.getHTML() ?? mod.html ?? "";
    // Update the store first so a refresh or tab switch keeps the content
    updateModule(key, course.id, activeModuleId, liveHtml);
    const html = liveHtml;
  const titleSlug = (mod.title || activeModuleId).replace(/[^\w-]+/g, "-");
    const yearPart = activeYearId || "year";
    const termPart = activeTerm?.id || "term";
    const fileName = `${titleSlug || "module"}.html`;
    const path = `AQ/Courses/${yearPart}/${termPart}/${course.id}/notes/${fileName}`;
    try {
      const file = new File([html], fileName, { type: "text/html" });
      const res = await saveToOPFS(path, file);
      if (res.ok) {
        // If OPFS is unavailable, saveToOPFS returns a blob URL; trigger a download for the user
        if ('url' in res && res.url) {
          const a = document.createElement('a');
          a.href = res.url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          // best-effort revoke
          setTimeout(() => URL.revokeObjectURL(res.url!), 1500);
        }
        toast({ title: "Notes saved", description: `${mod.title || "Module"} saved${'url' in res ? ' (downloaded)' : ''}.` });
      } else {
        const err = 'error' in res ? res.error : 'Unknown error';
        toast({ title: "Save failed", description: err });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Save failed", description: msg });
    }
  }, [course, activeModuleId, updateModule, key, activeYearId, activeTerm?.id, toast]);

  // Save on unmount (navigate away/refresh) - ensure last content is persisted into store
  React.useEffect(() => {
    const handler = () => {
      if (!course || !activeModuleId) return;
      const liveHtml = editorRef.current?.getHTML() ?? course.modules.find((m) => m.id === activeModuleId)?.html ?? "";
      updateModule(key, course.id, activeModuleId, liveHtml);
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [course, activeModuleId, key, updateModule]);

  // Ctrl/Cmd+S to save notes quickly (stable listener)
  const saveRef = React.useRef(onSaveModuleNotes);
  React.useEffect(() => { saveRef.current = onSaveModuleNotes; }, [onSaveModuleNotes]);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen w-full" style={gradientStyle}>
        <style>{scrollbarStyles}</style>
        <div className="max-w-[1400px] mx-auto px-3 py-6">
          <div className="flex items-center gap-3 mb-4">
            <CalendarDays className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Course Planner</h1>
          </div>
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/50 p-6">
            <div className="animate-pulse text-sm text-muted-foreground">Loading your courses…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={gradientStyle}>
  <style>{scrollbarStyles}</style>
      <div className="max-w-[1400px] mx-auto px-3 py-6 space-y-6">
        {/* Top header: title on first row, tabs on second row; course controls stay at top-right */}
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5" />
                <h1 className="text-2xl font-bold">Course Planner</h1>
              </div>
              <TopTabsInline active="courses" />
            </div>

            {/* Course switcher controls positioned at top-right */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Select
                value={course?.id ?? ""}
                onValueChange={(v) => {
                  if (v === "__add_new__") {
                    const id = addCourse(key, { title: "New Course", code: "" });
                    setSelectedCourse(id);
                  } else {
                    setSelectedCourse(v);
                  }
                }}
              >
                <SelectTrigger className="h-9 rounded-xl border border-black/10 bg-white/80 dark:bg-neutral-900/60 backdrop-blur min-w-[240px] 
                                       hover:bg-white/90 dark:hover:bg-neutral-900/70 transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="cursor-pointer hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-colors duration-200">
                      <span className="font-medium">{c.code || ""}</span>
                      {c.title ? <span className="opacity-70">{c.code ? " \u2014 " : ""}{c.title}</span> : null}
                    </SelectItem>
                  ))}
                  <div className="my-1 border-t border-black/10 dark:border-white/10" />
                  <SelectItem value="__add_new__" className="cursor-pointer hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-colors duration-200">
                    <span className="inline-flex items-center"><Plus className="h-4 w-4 mr-2" /> Add New Course</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button 
                size="sm" 
                className="h-8 rounded-2xl px-3 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                          text-gray-700 dark:text-gray-200 hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 
                          hover:text-blue-700 dark:hover:text-blue-300 shadow-md hover:shadow-lg backdrop-blur-sm 
                          border border-gray-200/60 dark:border-gray-600/40 hover:border-blue-200/60 dark:hover:border-blue-400/30
                          transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                          font-medium tracking-wide" 
                onClick={() => setYearTermOpen(true)}
                title="Select school year and term"
              >
                {year?.label || "Select Year"} {activeTerm ? `• ${activeTerm.name || `Term ${activeTerm.id}`}` : ""} <span className="ml-1 opacity-60">▼</span>
              </Button>
            </div>
          </div>
        </div>

        {/* === Two-column layout (30 / 70) ====================================== */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN (30%) — schedule → tasks → files */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Weekly checkbox schedule */}
            <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-white/95 to-white/85 dark:from-neutral-900/80 dark:to-neutral-800/70 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-400/20 dark:to-indigo-400/20">
                    <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">This Week</div>
                </div>
                <div className="grid grid-cols-7 gap-3">
                  {DAYS.map((d, idx) => (
                    <label
                      key={idx}
                      className="inline-flex flex-col items-center text-xs rounded-2xl p-3 cursor-pointer 
                                bg-gradient-to-br from-white/70 to-white/50 dark:from-neutral-800/50 dark:to-neutral-900/40
                                hover:from-blue-50/80 hover:to-indigo-50/60 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30
                                border border-gray-200/40 dark:border-gray-600/30 hover:border-blue-200/60 dark:hover:border-blue-400/40
                                transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-1 
                                shadow-sm hover:shadow-md backdrop-blur-sm group"
                    >
                      <input
                        type="checkbox"
                        checked={weeklyAttendance[idx] || false}
                        onChange={(e) => handleAttendanceChange(idx, e.target.checked)}
                        className="h-4 w-4 accent-blue-600 dark:accent-blue-400 rounded transition-all duration-200 group-hover:scale-110"
                      />
                      <span className="mt-2 text-gray-600 dark:text-gray-300 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">{d}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-blue-50/60 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/30 dark:border-blue-700/30">
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    ✓ Track your weekly attendance and completion progress to track your weekly scheduled classes for this course
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Tracker (synced with global tasks) */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 dark:bg-neutral-900/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold">Task Tracker</div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                              text-gray-700 dark:text-gray-200 hover:from-green-50/90 hover:to-emerald-50/80 dark:hover:from-green-950/40 dark:hover:to-emerald-950/30 
                              hover:text-green-700 dark:hover:text-green-300 shadow-md hover:shadow-lg backdrop-blur-sm 
                              border border-gray-200/60 dark:border-gray-600/40 hover:border-green-200/60 dark:hover:border-green-400/30
                              transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                              font-medium tracking-wide"
                    onClick={() => setAddTaskOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Task
                  </Button>
                </div>

                <div className="space-y-2">
                  {courseTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No tasks for this course yet.</p>
                      <p className="text-xs mt-1">Click "Add Task" to get started!</p>
                    </div>
                  ) : (
                    courseTasks.map((task) => (
                      <div
                        key={task.id}
                        className="grid grid-cols-[1fr_auto_auto] gap-3 items-center p-3 rounded-xl 
                                 bg-gradient-to-r from-white/90 to-gray-50/80 dark:from-gray-800/90 dark:to-gray-900/80
                                 border border-gray-200/60 dark:border-gray-600/40 shadow-sm hover:shadow-md
                                 transition-all duration-200"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
                            {task.title}
                          </div>
                          {task.dueDate && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                              {task.dueTime && ` at ${task.dueTime}`}
                            </div>
                          )}
                        </div>
                        
                        <select
                          className="h-8 rounded-lg border border-gray-200/60 dark:border-gray-600/40 
                                   bg-white/90 dark:bg-gray-800/90 px-2 text-xs
                                   focus:border-blue-400/60 dark:focus:border-purple-400/60
                                   focus:ring-2 focus:ring-blue-100/50 dark:focus:ring-purple-900/30"
                          value={task.status}
                          onChange={(e) =>
                            updateGlobalTask(task.id, {
                              status: e.target.value as TaskStatus,
                            })
                          }
                        >
                          <option value="Not Started">🔄 Not Started</option>
                          <option value="In Progress">⚡ In Progress</option>
                          <option value="Completed">✅ Completed</option>
                        </select>
                        
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-lg bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                                    text-gray-700 dark:text-gray-200 hover:from-red-50/90 hover:to-red-100/80 dark:hover:from-red-950/40 dark:hover:to-red-900/30 
                                    hover:text-red-700 dark:hover:text-red-300 shadow-sm hover:shadow-md backdrop-blur-sm 
                                    border border-gray-200/60 dark:border-gray-600/40 hover:border-red-200/60 dark:hover:border-red-400/30
                                    transition-all duration-200 hover:scale-105 active:scale-95
                                    font-medium tracking-wide h-8 px-2" 
                          onClick={() => removeGlobalTask(task.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Folder-style storage */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 dark:bg-neutral-900/60">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Course Files</div>
                  <div className="flex items-center gap-2">
                    <Select value={uploadTo} onValueChange={setUploadTo}>
                      <SelectTrigger className="h-9 rounded-xl min-w-[180px] bg-white/80 dark:bg-neutral-900/60">
                        <SelectValue placeholder="Upload to" />
                      </SelectTrigger>
                      <SelectContent>
                        {course?.folders.map((f) => (
                          <SelectItem key={f.id} value={f.path}>{f.path}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="file" multiple onChange={(e) => onUpload(uploadTo, e.target.files)} />
                  </div>
                </div>

                {/* Add folder */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New folder name (e.g., lectures/week1)"
                    value={newFolder}
                    onChange={(e) => setNewFolder(e.target.value)}
                  />
                  <Button 
                    className="rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                              text-gray-700 dark:text-gray-200 hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 
                              hover:text-blue-700 dark:hover:text-blue-300 shadow-md hover:shadow-lg backdrop-blur-sm 
                              border border-gray-200/60 dark:border-gray-600/40 hover:border-blue-200/60 dark:hover:border-blue-400/30
                              transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                              font-medium tracking-wide" 
                    onClick={handleAddFolder}
                  >
                    Add Folder
                  </Button>
                </div>

                {/* Folders and files list */}
                <div className="space-y-3">
                  {course?.folders.map((fold) => (
                    <div key={fold.id} className="rounded-xl border border-black/10 dark:border-white/10 p-3 bg-white/70 dark:bg-neutral-900/60">
                      <div className="flex items-center justify-between mb-2">
                        {renamingId === fold.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={renameText}
                              onChange={(e) => setRenameText(e.target.value)}
                              className="h-8"
                            />
                            <Button
                              size="sm"
                              className="rounded-2xl bg-gradient-to-r from-green-600/90 to-emerald-600/90 dark:from-green-500/90 dark:to-emerald-500/90
                                        hover:from-green-700/95 hover:to-emerald-700/95 dark:hover:from-green-400/95 dark:hover:to-emerald-400/95
                                        text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                                        hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                                        font-medium tracking-wide backdrop-blur-md
                                        ring-2 ring-green-200/50 dark:ring-green-400/30 hover:ring-green-300/60 dark:hover:ring-green-300/40"
                              onClick={() => {
                                if (!course) return;
                                const val = renameText.trim();
                                if (!val) return;
                                renameFolder(key, course.id, fold.id, val);
                                setRenamingId(null);
                                setRenameText("");
                              }}
                            >Save</Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                                        text-gray-700 dark:text-gray-200 hover:from-gray-50/90 hover:to-gray-100/80 dark:hover:from-gray-750/40 dark:hover:to-gray-850/30 
                                        shadow-md hover:shadow-lg backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/40
                                        transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0 
                                        font-medium tracking-wide" 
                              onClick={() => { setRenamingId(null); setRenameText(""); }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="text-xs font-semibold">{fold.path}</div>
                        )}
                        {renamingId !== fold.id && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                                      text-gray-700 dark:text-gray-200 hover:from-amber-50/90 hover:to-yellow-50/80 dark:hover:from-amber-950/40 dark:hover:to-yellow-950/30 
                                      hover:text-amber-700 dark:hover:text-amber-300 shadow-md hover:shadow-lg backdrop-blur-sm 
                                      border border-gray-200/60 dark:border-gray-600/40 hover:border-amber-200/60 dark:hover:border-amber-400/30
                                      transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                                      font-medium tracking-wide" 
                            onClick={() => { setRenamingId(fold.id); setRenameText(fold.path); }}
                          >
                            Rename
                          </Button>
                        )}
                      </div>

                      {/* file list */}
                      {fold.files.length === 0 ? (
                        <div className="text-xs text-muted-foreground">No files</div>
                      ) : (
                        <div className={`overflow-x-auto ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
                          <div className="min-w-[420px]">
                            <div className="grid grid-cols-[1fr_90px_180px] gap-2 px-2 py-1 text-[11px] text-muted-foreground border-b border-black/10 dark:border-white/10">
                              <div>Name</div>
                              <div className="text-right">Size</div>
                              <div className="text-right">Actions</div>
                            </div>
                            {fold.files.map((f) => (
                              <div key={f.id} className="grid grid-cols-[1fr_90px_180px] gap-2 items-center px-2 py-1 border-b border-black/5 dark:border-white/5 text-xs">
                                <div className="truncate" title={f.name}>{f.name}</div>
                                <div className="text-right">{(f.size / 1024).toFixed(1)} KB</div>
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                                              text-gray-700 dark:text-gray-200 hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 
                                              hover:text-blue-700 dark:hover:text-blue-300 shadow-md hover:shadow-lg backdrop-blur-sm 
                                              border border-gray-200/60 dark:border-gray-600/40 hover:border-blue-200/60 dark:hover:border-blue-400/30
                                              transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                                              font-medium tracking-wide" 
                                    onClick={() => openFile(f)}
                                  >
                                    Open
                                  </Button>
                                  <Select
                                    value={fold.path}
                                    onValueChange={(to) => {
                                      if (!course) return;
                                      if (to === fold.path) return;
                                      moveFile(key, course.id, f.id, fold.path, to);
                                    }}
                                  >
                                    <SelectTrigger className="h-8 w-[140px]">
                                      <SelectValue placeholder="Move to" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {course.folders.map((fd) => (
                                        <SelectItem key={fd.id} value={fd.path}>{fd.path}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN (70%) — title → meta → notes */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Course title (single control at the top) */}
            <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-white/95 to-white/85 dark:from-neutral-900/80 dark:to-neutral-800/70 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 dark:from-emerald-400/20 dark:to-teal-400/20">
                    <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">Course Information</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="courseTitle" className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 block">
                      Course Title
                    </Label>
                    <Input
                      id="courseTitle"
                      value={course?.title || ""}
                      onChange={(e) => updateCourse(key, { ...course!, title: e.target.value })}
                      placeholder="e.g., Introduction to Computer Science"
                      className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white/90 to-white/70 dark:from-neutral-800/60 dark:to-neutral-900/50 
                                backdrop-blur-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 
                                focus:shadow-xl focus:scale-[1.02] transition-all duration-200
                                hover:shadow-md hover:bg-gradient-to-br hover:from-white hover:to-white/90 
                                dark:hover:from-neutral-800/80 dark:hover:to-neutral-900/70"
                    />
                  </div>
                  <div className="w-40">
                    <Label htmlFor="courseCode" className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 block">
                      Course Code
                    </Label>
                    <Input
                      id="courseCode"
                      value={course?.code || ""}
                      onChange={(e) => updateCourse(key, { ...course!, code: e.target.value })}
                      placeholder="CS101"
                      className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white/90 to-white/70 dark:from-neutral-800/60 dark:to-neutral-900/50 
                                backdrop-blur-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 
                                focus:shadow-xl focus:scale-[1.02] transition-all duration-200
                                hover:shadow-md hover:bg-gradient-to-br hover:from-white hover:to-white/90 
                                dark:hover:from-neutral-800/80 dark:hover:to-neutral-900/70"
                    />
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/30 dark:border-emerald-700/30">
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    📚 Enter your course details to begin organizing modules and assignments
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructor + Class Time/Room (auto) + Syllabus */}
            <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-white/95 to-white/85 dark:from-neutral-900/80 dark:to-neutral-800/70 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 dark:from-purple-400/20 dark:to-violet-400/20">
                    <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">Course Details</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instructor" className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      👨‍🏫 Instructor
                    </Label>
                    <Input
                      id="instructor"
                      value={course?.instructor || ""}
                      onChange={(e) => updateCourse(key, { ...course!, instructor: e.target.value })}
                      placeholder="Professor Name"
                      className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white/90 to-white/70 dark:from-neutral-800/60 dark:to-neutral-900/50 
                                backdrop-blur-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 
                                focus:shadow-xl focus:scale-[1.02] transition-all duration-200
                                hover:shadow-md hover:bg-gradient-to-br hover:from-white hover:to-white/90 
                                dark:hover:from-neutral-800/80 dark:hover:to-neutral-900/70"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      🕐 Class Time
                    </Label>
                    <Input 
                      disabled 
                      value={classMeta.time} 
                      className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-gray-100/90 to-gray-100/70 dark:from-neutral-700/60 dark:to-neutral-800/50 
                                backdrop-blur-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      🏢 Room No.
                    </Label>
                    <Input 
                      disabled 
                      value={classMeta.room} 
                      className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-gray-100/90 to-gray-100/70 dark:from-neutral-700/60 dark:to-neutral-800/50 
                                backdrop-blur-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="syllabus" className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      📄 Syllabus URL
                    </Label>
                    <Input
                      id="syllabus"
                      value={course?.syllabusUrl || ""}
                      onChange={(e) => updateCourse(key, { ...course!, syllabusUrl: e.target.value })}
                      placeholder="https://example.com/syllabus"
                      className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white/90 to-white/70 dark:from-neutral-800/60 dark:to-neutral-900/50 
                                backdrop-blur-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 
                                focus:shadow-xl focus:scale-[1.02] transition-all duration-200
                                hover:shadow-md hover:bg-gradient-to-br hover:from-white hover:to-white/90 
                                dark:hover:from-neutral-800/80 dark:hover:to-neutral-900/70"
                    />
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-purple-50/60 to-violet-50/40 dark:from-purple-950/30 dark:to-violet-950/20 border border-purple-200/30 dark:border-purple-700/30">
                  <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                    ⚡ Class schedule auto-updates based on your selections above
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes: modules inside the notes card as compact chips on the left */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 dark:bg-neutral-900/60">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">Notes</div>
                  <Button 
                    size="sm" 
                    className="h-8 rounded-2xl px-3 bg-gradient-to-r from-green-600/90 to-emerald-600/90 dark:from-green-500/90 dark:to-emerald-500/90
                              hover:from-green-700/95 hover:to-emerald-700/95 dark:hover:from-green-400/95 dark:hover:to-emerald-400/95
                              text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                              hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                              font-medium tracking-wide backdrop-blur-md
                              ring-2 ring-green-200/50 dark:ring-green-400/30 hover:ring-green-300/60 dark:hover:ring-green-300/40" 
                    onClick={onSaveModuleNotes} 
                    disabled={!course || !activeModuleId}
                  >
                    <SaveIcon className="h-4 w-4 mr-1" /> Save
                  </Button>
                </div>
                <div className="flex items-start gap-3">
                  {/* Module chips column */}
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="text-xs font-semibold text-muted-foreground mb-1"></div>
                    <div className="flex flex-col gap-2">
                      {course?.modules.map((m) => (
                        <div key={m.id} className="relative group">
                          <Button
                            type="button"
                            variant={m.id === activeModuleId ? "default" : "outline"}
                            size="icon"
                            className={`h-8 w-8 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0 shadow-md hover:shadow-lg
                              ${m.id === activeModuleId 
                                ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 dark:from-blue-500/90 dark:to-indigo-500/90 text-white ring-2 ring-blue-200/50 dark:ring-blue-400/30 backdrop-blur-sm hover:from-blue-700/95 hover:to-indigo-700/95 dark:hover:from-blue-400/95 dark:hover:to-indigo-400/95' 
                                : 'bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 text-gray-700 dark:text-gray-200 hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 hover:text-blue-700 dark:hover:text-blue-300 border border-gray-200/60 dark:border-gray-600/40 hover:border-blue-200/60 dark:hover:border-blue-400/30'
                              }`}
                            onClick={() => setActiveModuleId(m.id)}
                            title={m.title}
                          >
                            <span className="text-[11px] font-semibold">{m.title}</span>
                          </Button>
                          {/* Hover delete X */}
                          <button
                            aria-label="Remove module"
                            className="hidden group-hover:flex absolute -top-1 -right-1 h-5 w-5 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white text-[10px] shadow-lg transition-all duration-200 hover:scale-110"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPendingDelete({ id: m.id, title: m.title });
                              setConfirmText("");
                              setDeleteOpen(true);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                                  text-gray-700 dark:text-gray-200 hover:from-green-50/90 hover:to-emerald-50/80 dark:hover:from-green-950/40 dark:hover:to-emerald-950/30 
                                  hover:text-green-700 dark:hover:text-green-300 shadow-md hover:shadow-lg backdrop-blur-sm 
                                  border border-gray-200/60 dark:border-gray-600/40 hover:border-green-200/60 dark:hover:border-green-400/30
                                  transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0"
                        onClick={() => {
                          const nextTitle = `M${(course?.modules.length || 0) + 1}`;
                          const id = addModule(key, course!.id, nextTitle);
                          setActiveModuleId(id);
                        }}
                        title="Add module"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Editor area grows */}
                  <div className="flex-1 min-w-0">
                    {course && activeModuleId ? (
                      <RichTextEditor
                        ref={editorRef}
                        value={course.modules.find((m) => m.id === activeModuleId)?.html || ""}
                        onChange={(html) => updateModule(key, course.id, activeModuleId, html)}
                        placeholder="Write your module notes here…"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground p-4">
                        Select a module on the left or create a new one.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={(open) => {
        setDeleteOpen(open);
        if (!open) { setPendingDelete(null); setConfirmText(""); }
      }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete module?</DialogTitle>
            <DialogDescription>
              This will permanently remove the module and its notes from this course. To confirm, type the module title below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm">Module: <span className="font-semibold">{pendingDelete?.title}</span></div>
            <Input
              autoFocus
              placeholder="Type module title to confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setPendingDelete(null); setConfirmText(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!pendingDelete || confirmText.trim() !== (pendingDelete?.title || "") || !course}
              onClick={() => {
                if (!course || !pendingDelete) return;
                // Remove and move selection to next available module
                const next = course.modules.find((x) => x.id !== pendingDelete.id)?.id;
                removeModule(key, course.id, pendingDelete.id);
                if (activeModuleId === pendingDelete.id) setActiveModuleId(next);
                setDeleteOpen(false);
                setPendingDelete(null);
                setConfirmText("");
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Add Task dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
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
              Add Task to {course?.code || course?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></span>
                Task Title
              </label>
              <Input 
                value={taskTitle} 
                onChange={(e) => setTaskTitle(e.target.value)} 
                placeholder="e.g., Assignment 3, Lab Report, Final Project..." 
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
                  value={taskDate} 
                  onChange={(e) => setTaskDate(e.target.value)} 
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
                  value={taskTime} 
                  onChange={(e) => setTaskTime(e.target.value)} 
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
                value={taskStatus} 
                onChange={(e)=> setTaskStatus(e.target.value as TaskStatus)}
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
              onClick={() => setAddTaskOpen(false)}
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
              onClick={commitAddTask}
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>Add Task</span>
                <span className="text-lg">✨</span>
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Year/Term Selection Dialog */}
      <Dialog open={yearTermOpen} onOpenChange={setYearTermOpen}>
        <DialogContent className="max-w-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
          <DialogHeader className="pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Select School Year & Term
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Year Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">School Year</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {years.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 text-center bg-gray-50/50 dark:bg-neutral-800/50 rounded-xl">
                    No school years available. Please add years in Schedule Planner first.
                  </div>
                ) : (
                  years.map((y) => (
                    <Button
                      key={y.id}
                      variant={y.id === activeYearId ? "default" : "outline"}
                      className={`w-full justify-start rounded-2xl transition-all duration-200 font-medium tracking-wide h-10
                        ${y.id === activeYearId 
                          ? "bg-gradient-to-r from-blue-600/90 to-indigo-600/90 dark:from-blue-500/90 dark:to-indigo-500/90 text-white shadow-lg ring-2 ring-blue-200/50 dark:ring-blue-400/30" 
                          : "bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 text-gray-700 dark:text-gray-200 hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30"
                        }
                        hover:scale-[1.02] active:scale-[0.98]`}
                      onClick={() => {
                        setCourseplannerSelectedYear(y.id);
                        // Reset term selection when year changes
                        if (y.terms?.[0]) {
                          setCourseplannerSelectedTerm(y.terms[0].id);
                        }
                      }}
                    >
                      {y.label}
                    </Button>
                  ))
                )}
              </div>
            </div>

            {/* Term Selection */}
            {year?.terms && year.terms.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Term</Label>
                <div className="grid grid-cols-2 gap-2">
                  {year.terms.map((t) => (
                    <Button
                      key={t.id}
                      variant={t.id === activeTerm?.id ? "default" : "outline"}
                      className={`justify-center rounded-2xl transition-all duration-200 font-medium tracking-wide h-10
                        ${t.id === activeTerm?.id 
                          ? "bg-gradient-to-r from-green-600/90 to-emerald-600/90 dark:from-green-500/90 dark:to-emerald-500/90 text-white shadow-lg ring-2 ring-green-200/50 dark:ring-green-400/30" 
                          : "bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 text-gray-700 dark:text-gray-200 hover:from-green-50/90 hover:to-emerald-50/80 dark:hover:from-green-950/40 dark:hover:to-emerald-950/30"
                        }
                        hover:scale-[1.02] active:scale-[0.98]`}
                      onClick={() => setCourseplannerSelectedTerm(t.id)}
                    >
                      {t.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <Button
              onClick={() => setYearTermOpen(false)}
              className="rounded-2xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 dark:from-blue-500/90 dark:to-indigo-500/90
                        hover:from-blue-700/95 hover:to-indigo-700/95 dark:hover:from-blue-400/95 dark:hover:to-indigo-400/95
                        text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                        hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0
                        font-medium tracking-wide backdrop-blur-md"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    );
  }
