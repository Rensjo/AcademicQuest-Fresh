/**
 * AcademicPlanner — Annotated & Organized
 * --------------------------------------
 * Screen for planning courses per School Year → Term.
 * - Matches Schedule Planner layout: horizontal scroll for terms, fixed right rail for "+ Add New Term",
 *   bottom "+ Add New School Year" button, and top inline tabs beside the title.
 * - Uses the same dynamic gradient background as Dashboard (palette + accent aware).
 * - Each term has an editable table of rows: Code · Course Name · Sec. · Credits · GPA.
 * - Shows running totals: Total Credits & weighted Term GPA.
 *
 * Major sections in this file:
 *   1) Imports & small utilities
 *   2) TopTabsInline (inline nav tabs beside title)
 *   3) RowEditor (single editable table row)
 *   4) TermCard (one term canvas)
 *   5) AcademicPlanner (page) — glue + dialogs + gradient
 *
 * Notes / Conventions:
 * - Keep UI-only state local (e.g., dialogs, refs). Persisted data lives in the zustand store.
 * - Select narrow slices from the store to limit unnecessary re-renders.
 * - Be careful with horizontal scroll containers: give term canvases a min-width.
 */

import React from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAcademicPlan, CourseRow } from "@/store/academicPlanStore";
import { useTheme, PALETTES } from "@/store/theme";
import { useSettings } from "@/store/settingsStore";
import TopTabsInline from "@/components/TopTabsInline";

// ----------------------------------
// 1) Imports & small utilities
// ----------------------------------

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

/** Build the same gradient background used on the Dashboard/Schedule pages. */
function useThemedGradient() {
  const theme = useTheme();
  const THEME_COLORS = PALETTES[theme.palette];
  const [accentLocal, setAccentLocal] = React.useState(theme.accent);
  React.useEffect(() => setAccentLocal(theme.accent), [theme.accent]);

  return React.useMemo(() => {
    const alpha = Math.min(0.35, Math.max(0.12, accentLocal / 260));
    const hex = Math.round(alpha * 255).toString(16).padStart(2, "0");
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

// ----------------------------------
// 2) RowEditor — single editable row
// ----------------------------------

/** Props for RowEditor. */
interface RowEditorProps {
  value: CourseRow;
  onChange: (r: CourseRow) => void;
  onRemove: () => void;
}

/**
 * RowEditor
 * Renders a single row in the term table, with inline inputs.
 * - The course name input is styled like a "pill" button per your design.
 * - Credits accepts decimals; GPA accepts 0–4.00 values.
 */
function RowEditor({ value, onChange, onRemove }: RowEditorProps) {
  return (
    <div className="grid grid-cols-[30px_100px_1fr_90px_70px_70px] gap-3 items-center px-2 py-2">
      {/* Remove row */}
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onRemove} 
        className="h-8 w-8 rounded-2xl
                  text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400
                  hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all duration-200
                  focus:text-red-500 dark:focus:text-red-400"
        title="Remove course"
      >
        <Trash2 className="h-3 w-3" />
      </Button>

      {/* Code */}
      <Input 
        value={value.code} 
        onChange={(e) => onChange({ ...value, code: e.target.value })} 
        placeholder="Code"
        className="h-8 rounded-2xl bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 
                  focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
                  transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs"
      />

      {/* Course name (pill) */}
      <div className="flex">
        <input
          className="flex-1 h-8 rounded-2xl bg-white/80 dark:bg-neutral-900/60 border border-gray-200/60 dark:border-gray-600/40 px-4
                    focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
                    transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 outline-none text-xs
                    placeholder:text-gray-400 dark:placeholder:text-gray-500"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Course name"
        />
      </div>

      {/* Section */}
      <Input 
        value={value.section} 
        onChange={(e) => onChange({ ...value, section: e.target.value })} 
        placeholder="Sec."
        className="h-8 rounded-2xl bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 
                  focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
                  transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs"
      />

      {/* Credits */}
      <Input 
        type="number" 
        step="0.5" 
        value={value.credits} 
        onChange={(e) => onChange({ ...value, credits: Number(e.target.value) || 0 })} 
        placeholder="Cr."
        className="h-8 rounded-2xl bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 
                  focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
                  transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs"
      />

      {/* GPA (0.00–4.00) */}
      <Input
        type="number"
        step="0.01"
        min={0}
        max={4}
        value={value.gpa ?? ""}
        onChange={(e) => onChange({ ...value, gpa: e.target.value === "" ? undefined : Number(e.target.value) })}
        placeholder="GPA"
        className="h-8 rounded-2xl bg-white/80 dark:bg-neutral-900/60 border-gray-200/60 dark:border-gray-600/40 
                  focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
                  transition-all duration-200 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-xs"
      />
    </div>
  );
}

// ----------------------------------
// 4) TermCard — one term canvas
// ----------------------------------

/** Props for one term canvas. */
interface TermCardProps { yearId: string; termIndex: number; }

/**
 * TermCard
 * Displays and edits a single term.
 * - Shows header, column headers, editable rows, and footer with totals.
 * - Totals: credits sum + weighted GPA (by credits).
 */
function TermCard({ yearId, termIndex }: TermCardProps) {
  // Select only what we need from the store
  const years = useAcademicPlan((s) => s.years);
  const addRow = useAcademicPlan((s) => s.addRow);
  const updateRow = useAcademicPlan((s) => s.updateRow);
  const removeRow = useAcademicPlan((s) => s.removeRow);
  const gpaScale = useSettings((s) => s.gpaScale);

  const year = years.find((y) => y.id === yearId);
  const term = year?.terms?.[termIndex];
  const courses = React.useMemo(() => term?.courses ?? [], [term?.courses]);

  // Derived totals
  const totalCredits = React.useMemo(
    () => courses.reduce((sum, r) => sum + (Number(r.credits) || 0), 0),
    [courses]
  );

  const termGPA = React.useMemo(() => {
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
  }, [courses]);

  // Convert display GPA if the user prefers a 1.00-highest scale (maps 0–4 → 5–1)
  const displayTermGPA = React.useMemo(() => {
    const g = Math.max(0, Math.min(4, termGPA));
    return gpaScale === '1-highest' ? (5 - g) : g;
  }, [termGPA, gpaScale]);

  if (!year || !term) return null;

  return (
    <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl 
                    ring-1 ring-gray-200/50 dark:ring-gray-600/50 min-w-[900px] hover:shadow-2xl transition-all duration-200">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-4">
          <div className="space-y-1">
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">{term.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Program plan this term</div>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            className="rounded-2xl bg-gradient-to-r from-green-600/90 to-emerald-600/90 dark:from-green-500/90 dark:to-emerald-500/90 
                      text-white shadow-lg ring-2 ring-green-200/50 dark:ring-green-400/30 backdrop-blur-sm border-0
                      hover:from-green-700/95 hover:to-emerald-700/95 dark:hover:from-green-400/95 dark:hover:to-emerald-400/95
                      transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0 
                      font-medium tracking-wide"
            onClick={() => addRow(yearId, term.id)}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Row
          </Button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[30px_100px_1fr_90px_70px_63px] gap-4 text-xs font-semibold 
                        text-gray-600 dark:text-gray-300 pb-3 border-b border-gray-200/60 dark:border-gray-600/40">
          <div></div><div>Code</div><div>Course Name</div><div>Sec.</div><div>Cr.</div><div>GPA</div>
        </div>

        {/* Editable rows */}
        <div className="divide-y divide-gray-100/60 dark:divide-gray-700/40">
          {term.courses.map((r) => (
            <RowEditor key={r.id} value={r} onChange={(row) => updateRow(yearId, term.id, row)} onRemove={() => removeRow(yearId, term.id, r.id)} />
          ))}
        </div>

        {/* Footer totals */}
        <div className="flex items-center justify-end pt-4 border-t border-gray-200/60 dark:border-gray-600/40 mt-4 gap-6">
          <div className="text-xs">
            <span className="text-gray-500 dark:text-gray-400 mr-2">Total Credits</span>
            <span className="font-semibold text-gray-800 dark:text-gray-100 bg-gray-100/80 dark:bg-gray-700/50 px-2 py-1 rounded-lg">{totalCredits}</span>
          </div>
          <div className="text-xs">
            <span className="text-gray-500 dark:text-gray-400 mr-2">Term GPA</span>
            <span className="font-semibold text-gray-800 dark:text-gray-100 bg-gray-100/80 dark:bg-gray-700/50 px-2 py-1 rounded-lg">{displayTermGPA.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------------------
// 5) AcademicPlanner — page component
// ----------------------------------

/**
 * AcademicPlanner (page)
 * - Renders all School Years, each with horizontally scrollable Terms.
 * - Keeps the "+ Add New Term" rail fixed on the right, matching Schedule Planner.
 * - Provides a dialog to pick/add a School Year and auto-scroll to it.
 */
export default function AcademicPlanner() {
  const gradientStyle = useThemedGradient();
  const theme = useTheme();
  // compute scrollbar skin class once per render
  const scrollCls = React.useMemo(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme.mode === "dark" || (theme.mode === "system" && prefersDark);
    return isDark ? "dark-scrollbar" : "light-scrollbar";
  }, [theme.mode]);

  // --- store selections & helpers ---
  const years = useAcademicPlan((s) => s.years);
  const selectedYearId = useAcademicPlan((s) => s.selectedYearId);
  const setSelectedYear = useAcademicPlan((s) => s.setSelectedYear);
  const addYear = useAcademicPlan((s) => s.addYear);
  const setTermsCount = useAcademicPlan((s) => s.setTermsCount);

  const activeYearId = selectedYearId || years[0]?.id;
  const activeYear = years.find((y) => y.id === activeYearId);

  // Refs to measure term heights per year so the right rail matches the tallest term.
  const termRefs = React.useRef<Record<string, HTMLDivElement[]>>({});
  const [termHeights, setTermHeights] = React.useState<Record<string, number>>({});

  /** Recalculate the maximum canvas height for a given year. */
  const updateHeightForYear = React.useCallback((yearId: string) => {
    if (!termRefs.current[yearId]?.length) return;
    const heights = termRefs.current[yearId].filter(Boolean).map((ref) => ref?.offsetHeight || 0);
    const maxHeight = heights.length > 0 ? Math.max(...heights) : 560;
    setTermHeights((prev) => (prev[yearId] === maxHeight ? prev : { ...prev, [yearId]: maxHeight }));
  }, []);

  // Observe content changes in each term (rows added/removed → height changes)
  React.useEffect(() => {
    const observers: MutationObserver[] = [];
    years.forEach((y) => {
      if (!termRefs.current[y.id]) return;
      termRefs.current[y.id].forEach((ref) => {
        if (!ref) return;
        const obs = new MutationObserver(() => updateHeightForYear(y.id));
        obs.observe(ref, { childList: true, subtree: true, attributes: true });
        observers.push(obs);
      });
      updateHeightForYear(y.id);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [years, updateHeightForYear]);

  // Year DOM refs to scroll into view when selected/added
  const yearRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  /** Compute the next SY label based on the highest existing year. */
  const getNextYearLabel = React.useCallback(() => {
    if (years.length === 0) return "SY 2025–2026";
    let maxYear = 2025;
    years.forEach((y) => {
      const match = y.label.match(/SY (\d{4})–(\d{4})/);
      if (match) { const start = parseInt(match[1], 10); if (start > maxYear) maxYear = start; }
    });
    return `SY ${maxYear + 1}–${maxYear + 2}`;
  }, [years]);

  // School year chooser dialog
  const [yearOpen, setYearOpen] = React.useState(false);

  return (
    <div className="min-h-screen w-full" style={gradientStyle}>
      <style>{scrollbarStyles}</style>
      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
        {/* Header (title + year chooser button) */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5" />
              <h1 className="text-2xl font-bold">Academic Planner</h1>
            </div>
            <TopTabsInline active="planner" />
          </div>
          <Button 
            variant="outline" 
            className="rounded-2xl h-11 bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                      text-gray-700 dark:text-gray-200 hover:from-cyan-50/90 hover:to-blue-50/80 dark:hover:from-cyan-950/40 dark:hover:to-blue-950/30 
                      hover:text-cyan-700 dark:hover:text-cyan-300 shadow-md hover:shadow-lg backdrop-blur-sm 
                      border border-gray-200/60 dark:border-gray-600/40 hover:border-cyan-200/60 dark:hover:border-cyan-400/30
                      transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0"
            onClick={() => setYearOpen(true)}
          >
            {activeYear?.label || "Choose School Year"} <span className="ml-1 opacity-60">▼</span>
          </Button>
        </div>

        {/* Year chooser dialog */}
        <Dialog open={yearOpen} onOpenChange={setYearOpen}>
          <DialogContent className="max-w-md rounded-3xl bg-white/95 dark:bg-neutral-800/95 backdrop-blur-xl border-0 shadow-2xl 
                                    ring-1 ring-gray-200/50 dark:ring-gray-600/50">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">Select School Year</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-64 overflow-auto">
              {years.map((y) => (
                <Button
                  key={y.id}
                  variant={y.id === activeYearId ? "default" : "outline"}
                  className={`w-full justify-start rounded-2xl text-lg py-5 transition-all duration-200 font-medium tracking-wide
                    ${y.id === activeYearId 
                      ? "bg-gradient-to-r from-cyan-600/90 to-blue-600/90 dark:from-cyan-500/90 dark:to-blue-500/90 text-white shadow-lg ring-2 ring-cyan-200/50 dark:ring-cyan-400/30 backdrop-blur-sm hover:from-cyan-700/95 hover:to-blue-700/95 dark:hover:from-cyan-400/95 dark:hover:to-blue-400/95" 
                      : "bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 text-gray-700 dark:text-gray-200 hover:from-cyan-50/90 hover:to-blue-50/80 dark:hover:from-cyan-950/40 dark:hover:to-blue-950/30 hover:text-cyan-700 dark:hover:text-cyan-300 shadow-md hover:shadow-lg backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/40 hover:border-cyan-200/60 dark:hover:border-cyan-400/30"
                    }
                    hover:scale-102 active:scale-98 hover:-translate-y-0.5 active:translate-y-0`}
                  onClick={() => {
                    setSelectedYear(y.id);
                    setYearOpen(false);
                    setTimeout(() => yearRefs.current[y.id]?.scrollIntoView({ behavior: "smooth", block: "start" }), 10);
                  }}
                >
                  {y.label}
                </Button>
              ))}
            </div>
            <DialogFooter className="mt-3">
              <Button
                className="bg-gradient-to-r from-green-600/90 to-emerald-600/90 dark:from-green-500/90 dark:to-emerald-500/90 
                          text-white shadow-lg ring-2 ring-green-200/50 dark:ring-green-400/30 backdrop-blur-sm 
                          hover:from-green-700/95 hover:to-emerald-700/95 dark:hover:from-green-400/95 dark:hover:to-emerald-400/95
                          transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0 
                          rounded-2xl font-medium tracking-wide"
                onClick={() => {
                  const newLabel = getNextYearLabel();
                  addYear(newLabel);
                  setYearOpen(false);
                  setTimeout(() => {
                    const last = years[years.length - 1];
                    if (last?.id) {
                      setSelectedYear(last.id);
                      yearRefs.current[last.id]?.scrollIntoView({ behavior: "smooth" });
                    }
                  }, 10);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add School Year
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Render all School Years vertically (each row horizontally scrolls its Terms) */}
        <div className="space-y-16">
          {years.map((y) => (
            <div key={y.id} className="space-y-6" ref={(el) => { yearRefs.current[y.id] = el; }}>
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 
                              bg-clip-text text-transparent">
                  {y.label}
                </h2>
              </div>

              <div className="flex">
                {/* Scrollable Terms */}
                <div className={`overflow-x-auto flex-1 ${scrollCls}`}>
                  <div className="flex gap-6 items-start min-w-max">
                    {y.terms.map((_, idx) => (
                      <div
                        key={idx}
                        ref={(el) => {
                          if (!termRefs.current[y.id]) termRefs.current[y.id] = [];
                          if (el) {
                            while (termRefs.current[y.id].length <= idx) termRefs.current[y.id].push(null as unknown as HTMLDivElement);
                            termRefs.current[y.id][idx] = el;
                            setTimeout(() => updateHeightForYear(y.id), 0);
                          }
                        }}
                      >
                        <TermCard yearId={y.id} termIndex={idx} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fixed right rail: "+ Add New Term" */}
                <div className="ml-4 w-[120px] shrink-0 flex">
                  <button
                    className="w-full rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                              border border-gray-200/60 dark:border-gray-600/40 shadow-md backdrop-blur-sm
                              hover:from-green-50/90 hover:to-emerald-50/80 dark:hover:from-green-950/40 dark:hover:to-emerald-950/30 
                              hover:text-green-700 dark:hover:text-green-300 hover:shadow-lg hover:border-green-200/60 dark:hover:border-green-400/30
                              transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed
                              disabled:hover:scale-100 disabled:hover:shadow-md"
                    style={{ height: termHeights[y.id] || 560 }}
                    onClick={() => setTermsCount(y.id, (Math.min(4, y.terms.length + 1) as 2 | 3 | 4))}
                    title={y.terms.length >= 4 ? "Max 4 terms" : "Add new term"}
                    disabled={y.terms.length >= 4}
                  >
                    <span className={`block rotate-90 whitespace-nowrap text-lg md:text-xl font-semibold tracking-wide select-none 
                                      ${y.terms.length >= 4 ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-300"}`
                                    }>
                      {y.terms.length >= 4 ? "Max Terms" : "+ Add New Term"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom: Add New School Year */}
        <div className="mt-4 pb-8">
          <Button
            className="w-full h-24 rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                      border border-gray-200/60 dark:border-gray-600/40 shadow-md backdrop-blur-sm
                      hover:from-green-50/90 hover:to-emerald-50/80 dark:hover:from-green-950/40 dark:hover:to-emerald-950/30 
                      hover:text-green-700 dark:hover:text-green-300 hover:shadow-lg hover:border-green-200/60 dark:hover:border-green-400/30
                      transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-1 active:translate-y-0
                      text-gray-600 dark:text-gray-300 font-semibold"
            onClick={() => {
              const newLabel = getNextYearLabel();
              addYear(newLabel);
              setTimeout(() => {
                const lastYear = years[years.length - 1];
                if (lastYear?.id) {
                  setSelectedYear(lastYear.id);
                  yearRefs.current[lastYear.id]?.scrollIntoView({ behavior: "smooth" });
                }
              }, 10);
            }}
          >
            <Plus className="h-5 w-5 mr-2" /> Add New School Year
          </Button>
        </div>
      </div>
    </div>
  );
}
