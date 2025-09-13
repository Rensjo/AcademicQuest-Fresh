import { create } from "zustand";
import { persist } from "zustand/middleware";
import { rewardFirstCourse, checkSemesterOrganizer, checkGPABadges, rewardGradeEntry, checkGradeWarrior } from "./gamificationHelpers";

export type CourseId = string;

export type Course = {
  id: CourseId;
  code: string;
  title: string;
  instructor?: string;
  syllabusUrl?: string;
  linkedSlotId?: string; // optional explicit link to a Schedule slot
  // Weekly attendance tracking (0=Sunday, 1=Monday, ..., 6=Saturday, 7=Sunday2)
  weeklyAttendance: Record<string, boolean[]>; // key = week identifier (YYYY-MM-DD of Monday), value = [S,M,T,W,Th,F,S2]
  // Note modules
  modules: Array<{ id: string; title: string; html: string }>;
  // Tasks for this course
  tasks: Array<{
    id: string;
    title: string;
    due?: string;     // ISO date-time
    status: "in-progress" | "complete" | "overdue";
    grade?: number;   // optional % for that task
  }>;
  // Simple folder tree: path segments joined with "/"
  folders: Array<{
    id: string;
    path: string;      // "root/lectures/week1"
    files: Array<{ id: string; name: string; size: number; opfsPath?: string; url?: string }>;
  }>;
};

export type YearTermKey = `${string}::${string}`; // `${yearId}::${termId}`

type State = {
  byYearTerm: Record<YearTermKey, Course[]>;
  selectedCourseId?: CourseId;
  selectedYearId?: string;
  selectedTermId?: string;

  setSelectedCourse: (id?: CourseId) => void;
  setSelectedYear: (id?: string) => void;
  setSelectedTerm: (id?: string) => void;

  addCourse: (key: YearTermKey, data?: Partial<Course>) => CourseId;
  updateCourse: (key: YearTermKey, course: Course) => void;
  removeCourse: (key: YearTermKey, id: CourseId) => void;

  addModule: (key: YearTermKey, courseId: CourseId, title?: string) => string;
  removeModule: (key: YearTermKey, courseId: CourseId, moduleId: string) => void;
  updateModule: (key: YearTermKey, courseId: CourseId, moduleId: string, html: string) => void;

  addTask: (key: YearTermKey, courseId: CourseId, task: Course["tasks"][number]) => void;
  updateTask: (key: YearTermKey, courseId: CourseId, task: Course["tasks"][number]) => void;
  removeTask: (key: YearTermKey, courseId: CourseId, taskId: string) => void;

  // Weekly attendance management
  updateWeeklyAttendance: (key: YearTermKey, courseId: CourseId, weekKey: string, dayIndex: number, attended: boolean) => void;
  getWeeklyAttendance: (key: YearTermKey, courseId: CourseId, weekKey: string) => boolean[];

  ensureFolder: (key: YearTermKey, courseId: CourseId, path: string) => void;
  renameFolder: (key: YearTermKey, courseId: CourseId, folderId: string, newPath: string) => void;
  addFileToFolder: (
    key: YearTermKey,
    courseId: CourseId,
    path: string,
    file: { id: string; name: string; size: number; opfsPath?: string; url?: string }
  ) => void;
  moveFile: (
    key: YearTermKey,
    courseId: CourseId,
    fileId: string,
    fromPath: string,
    toPath: string
  ) => void;
};

const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 8)}`;

export const useCoursePlanner = create<State>()(
  persist(
  (set, get) => ({
      byYearTerm: {},
      selectedCourseId: undefined,
      selectedYearId: undefined,
      selectedTermId: undefined,

      setSelectedCourse: (id) => set({ selectedCourseId: id }),
      setSelectedYear: (id) => set({ selectedYearId: id }),
      setSelectedTerm: (id) => set({ selectedTermId: id }),

      addCourse: (key, data) => {
        const id = uid("course");
        const course: Course = {
          id,
          code: data?.code || "",
          title: data?.title || "Untitled Course",
          instructor: data?.instructor,
          syllabusUrl: data?.syllabusUrl,
          linkedSlotId: data?.linkedSlotId,
          weeklyAttendance: {}, // Initialize empty weekly attendance
          modules: [{ id: uid("m"), title: "M1", html: "" }],
          tasks: [],
          folders: [{ id: uid("fold"), path: "root", files: [] }],
        };
        
        set((s) => {
          const currentCourses = s.byYearTerm[key] || [];
          const isFirstCourse = currentCourses.length === 0;
          
          const newState = {
            byYearTerm: {
              ...s.byYearTerm,
              [key]: [...currentCourses, course],
            },
            selectedCourseId: id,
          };
          
          // Trigger gamification rewards
          if (isFirstCourse) {
            setTimeout(() => rewardFirstCourse(), 0);
          }
          
          // Check semester organizer progress
          setTimeout(() => checkSemesterOrganizer(currentCourses.length + 1), 100);
          
          return newState;
        });
        
        return id;
      },

      updateCourse: (key, course) =>
        set((s) => ({
          byYearTerm: {
            ...s.byYearTerm,
            [key]: (s.byYearTerm[key] || []).map((c) => (c.id === course.id ? course : c)),
          },
        })),

      removeCourse: (key, id) =>
        set((s) => ({
          byYearTerm: {
            ...s.byYearTerm,
            [key]: (s.byYearTerm[key] || []).filter((c) => c.id !== id),
          },
          selectedCourseId: s.selectedCourseId === id ? undefined : s.selectedCourseId,
        })),

      addModule: (key, courseId, title = `M${Math.floor(Math.random() * 90) + 2}`) => {
        const mid = uid("m");
        set((s) => ({
          byYearTerm: {
            ...s.byYearTerm,
            [key]: (s.byYearTerm[key] || []).map((c) =>
              c.id !== courseId ? c : { ...c, modules: [...c.modules, { id: mid, title, html: "" }] }
            ),
          },
        }));
        return mid;
      },

      removeModule: (key, courseId, moduleId) =>
        set((s) => ({
          byYearTerm: {
            ...s.byYearTerm,
            [key]: (s.byYearTerm[key] || []).map((c) =>
              c.id !== courseId ? c : { ...c, modules: c.modules.filter((m) => m.id !== moduleId) }
            ),
          },
        })),

      updateModule: (key, courseId, moduleId, html) =>
        set((s) => ({
          byYearTerm: {
            ...s.byYearTerm,
            [key]: (s.byYearTerm[key] || []).map((c) =>
              c.id !== courseId ? c : { ...c, modules: c.modules.map((m) => (m.id === moduleId ? { ...m, html } : m)) }
            ),
          },
        })),

      addTask: (key, courseId, task) =>
        set((s) => {
          const newState = {
            byYearTerm: {
              ...s.byYearTerm,
              [key]: (s.byYearTerm[key] || []).map((c) =>
                c.id !== courseId ? c : { ...c, tasks: [...c.tasks, task] }
              ),
            },
          };
          
          // Count total assignments with grades across all courses
          setTimeout(() => {
            const allCourses = Object.values(s.byYearTerm).flat();
            const totalGradedAssignments = allCourses.reduce((count, course) => 
              count + course.tasks.filter(t => t.grade !== undefined).length, 0
            );
            checkGradeWarrior(totalGradedAssignments);
          }, 0);
          
          return newState;
        }),

      updateTask: (key, courseId, task) =>
        set((s) => {
          const course = (s.byYearTerm[key] || []).find(c => c.id === courseId);
          const oldTask = course?.tasks.find(t => t.id === task.id);
          
          const newState = {
            byYearTerm: {
              ...s.byYearTerm,
              [key]: (s.byYearTerm[key] || []).map((c) =>
                c.id !== courseId ? c : { ...c, tasks: c.tasks.map((t) => (t.id === task.id ? task : t)) }
              ),
            },
          };
          
          // Check if a grade was added
          if (task.grade !== undefined && oldTask?.grade === undefined) {
            setTimeout(() => rewardGradeEntry(), 0);
          }
          
          // Count total assignments with grades and check for badges
          setTimeout(() => {
            const allCourses = Object.values(s.byYearTerm).flat();
            const totalGradedAssignments = allCourses.reduce((count, course) => 
              count + course.tasks.filter(t => t.grade !== undefined).length, 0
            );
            checkGradeWarrior(totalGradedAssignments);
            
            // Calculate GPA and check GPA badges
            const gradedTasks = allCourses.flatMap(course => 
              course.tasks.filter(t => t.grade !== undefined)
            );
            
            if (gradedTasks.length > 0) {
              const averageGrade = gradedTasks.reduce((sum, task) => sum + (task.grade || 0), 0) / gradedTasks.length;
              // Convert percentage to 4.0 scale (rough approximation)
              const gpa = (averageGrade / 100) * 4.0;
              checkGPABadges(gpa);
            }
          }, 100);
          
          return newState;
        }),

      removeTask: (key, courseId, taskId) =>
        set((s) => ({
          byYearTerm: {
            ...s.byYearTerm,
            [key]: (s.byYearTerm[key] || []).map((c) =>
              c.id !== courseId ? c : { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }
            ),
          },
        })),

      // Weekly attendance management
      updateWeeklyAttendance: (key, courseId, weekKey, dayIndex, attended) =>
        set((s) => ({
          byYearTerm: {
            ...s.byYearTerm,
            [key]: (s.byYearTerm[key] || []).map((c) =>
              c.id !== courseId ? c : {
                ...c,
                weeklyAttendance: {
                  ...(c.weeklyAttendance || {}),
                  [weekKey]: (c.weeklyAttendance?.[weekKey] || Array.from({ length: 7 }, () => false))
                    .map((day, index) => index === dayIndex ? attended : day)
                }
              }
            ),
          },
        })),

      getWeeklyAttendance: (key, courseId, weekKey) => {
        const course = get().byYearTerm[key]?.find(c => c.id === courseId);
        return course?.weeklyAttendance?.[weekKey] || Array.from({ length: 7 }, () => false);
      },

      ensureFolder: (key, courseId, path) =>
        set((s) => ({
          byYearTerm: {
            ...s.byYearTerm,
            [key]: (s.byYearTerm[key] || []).map((c) =>
              c.id !== courseId
                ? c
                : c.folders.some((f) => f.path === path)
                ? c
                : { ...c, folders: [...c.folders, { id: uid("fold"), path, files: [] }] }
            ),
          },
        })),

      renameFolder: (key, courseId, folderId, newPath) =>
        set((s) => ({
          byYearTerm: {
            ...s.byYearTerm,
            [key]: (s.byYearTerm[key] || []).map((c) =>
              c.id !== courseId
                ? c
                : {
                    ...c,
                    folders: c.folders.map((f) => (f.id === folderId ? { ...f, path: newPath } : f)),
                  }
            ),
          },
        })),

      addFileToFolder: (key, courseId, path, file) =>
        set((s) => ({
          byYearTerm: {
            ...s.byYearTerm,
            [key]: (s.byYearTerm[key] || []).map((c) =>
              c.id !== courseId
                ? c
                : {
                    ...c,
                    folders: c.folders.map((f) =>
                      f.path === path ? { ...f, files: [...f.files, file] } : f
                    ),
                  }
            ),
          },
        })),

      moveFile: (key, courseId, fileId, fromPath, toPath) =>
        set((s) => ({
          byYearTerm: {
            ...s.byYearTerm,
            [key]: (s.byYearTerm[key] || []).map((c) => {
              if (c.id !== courseId) return c;
              let moved: Course["folders"][number]["files"][number] | undefined;
              const folders = c.folders.map((f) => {
                if (f.path === fromPath) {
                  const remaining = f.files.filter((fl) => {
                    if (fl.id === fileId) {
                      moved = fl;
                      return false;
                    }
                    return true;
                  });
                  return { ...f, files: remaining };
                }
                return f;
              }).map((f) => (f.path === toPath && moved ? { ...f, files: [...f.files, moved!] } : f));
              return { ...c, folders };
            }),
          },
        })),
  }),
  { name: "aq:course-planner" }
  )
);
