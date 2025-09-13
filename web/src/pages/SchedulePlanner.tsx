// src/pages/SchedulePlanner.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { useSchedule, DayIndex, Slot, Term } from "@/store/scheduleStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme, PALETTES } from "@/store/theme";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Add scrollbar styles
const scrollbarStyles = `
  /* Light theme scrollbars */
  .light-scrollbar::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  .light-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 5px;
  }
  
  .light-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 5px;
  }
  
  .light-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }
  
  /* Dark theme scrollbars - what you already have */
  .dark-scrollbar::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  .dark-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
  }
  
  .dark-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 5px;
  }
  
  .dark-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

// ------------------------------------------------------------
// Clean Schedule Planner (matches sketch)
// - Top inline tabs beside page title
// - No mini calendar; date range lives in a small dialog opened
//   by a button beside "Add Block"
// - Two visible term canvases for the selected school year
// - Tall right rail "+ Add New Term" with vertical text
// - Background matches Dashboard gradient
// ------------------------------------------------------------

// grid constants
const START_HOUR = 7; // 07:00
const END_HOUR = 21; // 21:00
const STEP_MIN = 30; // 30-minute increments
const ROWS = ((END_HOUR - START_HOUR) * 60) / STEP_MIN;
const ROW_H = 28; // px per row
const GRID_PX = ROWS * ROW_H; // useful for full-height right rail

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const COLORS = [
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#a78bfa",
  "#ef4444",
  "#06b6d4",
  "#f97316",
];

function hmToIndex(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  const idx = (h - START_HOUR) * (60 / STEP_MIN) + Math.floor(m / STEP_MIN);
  return Math.max(0, Math.min(ROWS, idx));
}
function indexToHM(idx: number) {
  const mins = START_HOUR * 60 + idx * STEP_MIN;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ---------- Block Editor Dialog ----------
type Draft = {
  id?: string;
  title: string;
  courseCode?: string;
  room?: string;
  building?: string;
  link?: string;
  day: DayIndex;
  start: string;
  end: string;
  color?: string;
};

function BlockDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  initial: Draft;
  onSave: (d: Draft) => void;
  onDelete?: () => void;
}) {
  const [d, setD] = React.useState<Draft>(initial);
  React.useEffect(() => setD(initial), [initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
        <DialogHeader className="pb-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
            {d.id ? (
              <>
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Block
              </>
            ) : (
              <>
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Block
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Course / Agenda Name
              </Label>
              <Input
                value={d.title}
                onChange={(e) => setD({ ...d, title: e.target.value })}
                placeholder="e.g., Algorithms (LEC)"
                className="rounded-2xl h-11 bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
                          focus:border-green-400/60 dark:focus:border-emerald-400/60 focus:ring-2 focus:ring-green-200/50 dark:focus:ring-emerald-400/20
                          transition-all duration-300 backdrop-blur-md"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Course Code
              </Label>
              <Input
                value={d.courseCode ?? ""}
                onChange={(e) => setD({ ...d, courseCode: e.target.value })}
                placeholder="e.g., CS101"
                className="rounded-2xl h-11 bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
                          focus:border-green-400/60 dark:focus:border-emerald-400/60 focus:ring-2 focus:ring-green-200/50 dark:focus:ring-emerald-400/20
                          transition-all duration-300 backdrop-blur-md"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Room
              </Label>
              <Input
                value={d.room ?? ""}
                onChange={(e) => setD({ ...d, room: e.target.value })}
                placeholder="e.g., B402"
                className="rounded-2xl h-11 bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
                          focus:border-green-400/60 dark:focus:border-emerald-400/60 focus:ring-2 focus:ring-green-200/50 dark:focus:ring-emerald-400/20
                          transition-all duration-300 backdrop-blur-md"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Building
              </Label>
              <Input
                value={d.building ?? ""}
                onChange={(e) => setD({ ...d, building: e.target.value })}
                placeholder="e.g., Engineering Hall"
                className="rounded-2xl h-11 bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
                          focus:border-green-400/60 dark:focus:border-emerald-400/60 focus:ring-2 focus:ring-green-200/50 dark:focus:ring-emerald-400/20
                          transition-all duration-300 backdrop-blur-md"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Link <span className="text-gray-500 text-xs">(optional)</span>
              </Label>
              <Input
                value={d.link ?? ""}
                onChange={(e) => setD({ ...d, link: e.target.value })}
                placeholder="https://..."
                className="rounded-2xl h-11 bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
                          focus:border-green-400/60 dark:focus:border-emerald-400/60 focus:ring-2 focus:ring-green-200/50 dark:focus:ring-emerald-400/20
                          transition-all duration-300 backdrop-blur-md"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Day
              </Label>
              <Select
                value={d.day.toString()}
                onValueChange={(value) => setD({ ...d, day: Number(value) as DayIndex })}
              >
                <SelectTrigger className="h-11 rounded-2xl bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
                                        focus:border-green-400/60 dark:focus:border-emerald-400/60 focus:ring-2 focus:ring-green-200/50 dark:focus:ring-emerald-400/20
                                        transition-all duration-300 backdrop-blur-md text-gray-700 dark:text-gray-200
                                        shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl bg-white/95 dark:bg-neutral-800/95 backdrop-blur-xl border-0 shadow-2xl 
                                         ring-1 ring-gray-200/50 dark:ring-gray-600/50">
                  {DAYS.map((name, idx) => (
                    <SelectItem 
                      key={name} 
                      value={idx.toString()}
                      className="rounded-xl mx-1 my-0.5 focus:bg-green-50/90 dark:focus:bg-emerald-950/30 
                                focus:text-green-700 dark:focus:text-emerald-300 cursor-pointer
                                transition-all duration-200 hover:bg-green-50/50 dark:hover:bg-emerald-950/20"
                    >
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Start Time
              </Label>
              <Input
                type="time"
                value={d.start}
                onChange={(e) => setD({ ...d, start: e.target.value })}
                className="rounded-2xl h-11 bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
                          focus:border-green-400/60 dark:focus:border-emerald-400/60 focus:ring-2 focus:ring-green-200/50 dark:focus:ring-emerald-400/20
                          transition-all duration-300 backdrop-blur-md"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                End Time
              </Label>
              <Input
                type="time"
                value={d.end}
                onChange={(e) => setD({ ...d, end: e.target.value })}
                className="rounded-2xl h-11 bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
                          focus:border-green-400/60 dark:focus:border-emerald-400/60 focus:ring-2 focus:ring-green-200/50 dark:focus:ring-emerald-400/20
                          transition-all duration-300 backdrop-blur-md"
              />
            </div>

            <div className="col-span-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                Color Theme
              </Label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setD({ ...d, color: c })}
                    className={`h-10 w-10 rounded-2xl border-2 transition-all duration-300 hover:scale-110 active:scale-95 ${
                      d.color === c 
                        ? "ring-4 ring-gray-400/50 dark:ring-gray-300/50 border-white dark:border-neutral-800 shadow-lg" 
                        : "border-gray-200/60 dark:border-gray-600/40 hover:border-gray-300/80 dark:hover:border-gray-500/60 shadow-md hover:shadow-lg"
                    }`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50 flex gap-3">
          {onDelete && (
            <Button 
              variant="destructive" 
              onClick={onDelete}
              className="rounded-2xl bg-gradient-to-r from-red-600/90 to-red-700/90 dark:from-red-500/90 dark:to-red-600/90
                        hover:from-red-700/95 hover:to-red-800/95 dark:hover:from-red-400/95 dark:hover:to-red-500/95
                        text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                        hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0
                        font-medium tracking-wide backdrop-blur-md
                        ring-2 ring-red-200/50 dark:ring-red-400/30 hover:ring-red-300/60 dark:hover:ring-red-300/40"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                      text-gray-700 dark:text-gray-200 hover:from-gray-50/90 hover:to-gray-100/80 dark:hover:from-gray-750/40 dark:hover:to-gray-850/30 
                      shadow-md hover:shadow-lg backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/40
                      transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-medium tracking-wide"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => onSave(d)}
            className="rounded-2xl bg-gradient-to-r from-green-600/90 to-emerald-600/90 dark:from-green-500/90 dark:to-emerald-500/90
                      hover:from-green-700/95 hover:to-emerald-700/95 dark:hover:from-green-400/95 dark:hover:to-emerald-400/95
                      text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                      hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0
                      font-medium tracking-wide backdrop-blur-md
                      ring-2 ring-green-200/50 dark:ring-green-400/30 hover:ring-green-300/60 dark:hover:ring-green-300/40"
          >
            {d.id ? "Save Changes" : "Add Block"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Term Range Button (opens a tiny dialog) ----------
function TermRangeButton({
  start,
  end,
  onSave,
}: {
  start?: string;
  end?: string;
  onSave: (s?: string, e?: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [s, setS] = React.useState<string | undefined>(start);
  const [e, setE] = React.useState<string | undefined>(end);
  React.useEffect(() => {
    setS(start);
    setE(end);
  }, [start, end]);

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setOpen(true)} 
        className="rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                  text-gray-700 dark:text-gray-200 hover:from-cyan-50/90 hover:to-sky-50/80 dark:hover:from-cyan-950/40 dark:hover:to-sky-950/30 
                  hover:text-cyan-700 dark:hover:text-cyan-300 shadow-md hover:shadow-lg backdrop-blur-sm 
                  border border-gray-200/60 dark:border-gray-600/40 hover:border-cyan-200/60 dark:hover:border-cyan-400/30
                  transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0
                  font-medium tracking-wide"
      >
        {start && end ? `${start} — ${end}` : "Set Term Range"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-white/95 dark:bg-neutral-800/95 backdrop-blur-xl border-0 shadow-2xl 
                                  ring-1 ring-gray-200/50 dark:ring-gray-600/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Term Date Range</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Set the start and end dates for this academic term to enable schedule tracking.
            </p>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</Label>
              <Input 
                type="date" 
                value={s ?? ""} 
                onChange={(ev) => setS(ev.target.value)}
                className="rounded-2xl h-11 bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
                          focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
                          transition-all duration-300 backdrop-blur-md"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</Label>
              <Input 
                type="date" 
                value={e ?? ""} 
                onChange={(ev) => setE(ev.target.value)}
                className="rounded-2xl h-11 bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
                          focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
                          transition-all duration-300 backdrop-blur-md"
              />
            </div>
          </div>
          <DialogFooter className="mt-6 gap-3">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                        text-gray-700 dark:text-gray-200 hover:from-gray-50/90 hover:to-gray-100/80 dark:hover:from-gray-750/40 dark:hover:to-gray-850/30 
                        shadow-md hover:shadow-lg backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/40
                        transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-medium tracking-wide"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSave(s, e);
                setOpen(false);
              }}
              className="rounded-2xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 dark:from-blue-500/90 dark:to-indigo-500/90
                        hover:from-blue-700/95 hover:to-indigo-700/95 dark:hover:from-blue-400/95 dark:hover:to-indigo-400/95
                        text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                        hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                        font-medium tracking-wide backdrop-blur-md
                        ring-2 ring-blue-200/50 dark:ring-blue-400/30 hover:ring-blue-300/60 dark:hover:ring-blue-300/40"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------- One Term Column ----------
function TermColumnBody({ yearId, term }: { yearId: string; term: Term }) {
  // store actions
  const addSlot = useSchedule((s) => s.addSlot);
  const updateSlot = useSchedule((s) => s.updateSlot);
  const removeSlot = useSchedule((s) => s.removeSlot);
  const setTermDates = useSchedule((s) => s.setTermDates);

  const hasDateRange = Boolean(term.startDate && term.endDate);

  // dialog state for block editor
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft | null>(null);

  // term date dialog
  const [dateDialogOpen, setDateDialogOpen] = React.useState(false);

  const daysBlocks = React.useMemo(() => {
    const byDay: Record<DayIndex, Slot[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const s of term.slots) byDay[s.day].push(s as Slot);
    ([-1,0,1,2,3,4,5,6].slice(1) as DayIndex[]).forEach((di) => {
      byDay[di].sort((a, b) => hmToIndex(a.start) - hmToIndex(b.start));
    });
    return byDay;
  }, [term.slots]);

  function openCreate(day: DayIndex, idx: number) {
    // Don't allow creating blocks if date range isn't set
    if (!hasDateRange) {
      setDateDialogOpen(true);
      return;
    }

    const start = indexToHM(idx);
    const end = indexToHM(Math.min(idx + 2, ROWS)); // default 1hr
    setDraft({
      title: "",
      day,
      start,
      end,
      color: COLORS[(day + idx) % COLORS.length],
    });
    setOpen(true);
  }

  function onGridClick(day: DayIndex, e: React.MouseEvent<HTMLDivElement>) {
    // Don't allow creating blocks if date range isn't set
    if (!hasDateRange) {
      setDateDialogOpen(true);
      return;
    }
    
    const bounds = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - bounds.top;
    const idx = Math.max(0, Math.floor(y / ROW_H));
    openCreate(day, idx);
  }

  function onSaveBlock(d: Draft) {
    if (d.id) updateSlot(yearId, term.id, d as Slot);
    else addSlot(yearId, term.id, d as Omit<Slot, "id">);
    setOpen(false);
    setDraft(null);
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Header with Term Info */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-white/80 to-gray-50/70 
                      dark:from-neutral-800/80 dark:to-neutral-900/70 border border-gray-200/60 dark:border-gray-600/40 
                      shadow-md backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 
                         dark:from-blue-900/40 dark:to-indigo-900/40">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
              <path d="M8 2v4"/>
              <path d="M16 2v4"/>
              <rect width="18" height="18" x="3" y="4" rx="2"/>
              <path d="M3 10h18"/>
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{term.name}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {term.startDate && term.endDate ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50/80 dark:bg-green-900/30 
                                 text-green-700 dark:text-green-300 border border-green-200/60 dark:border-green-700/40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <path d="M9 11l3 3L22 4"/>
                    </svg>
                    {term.startDate} — {term.endDate}
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50/80 dark:bg-amber-900/30 
                               text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-700/40">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  Dates not set
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TermRangeButton
            start={term.startDate}
            end={term.endDate}
            onSave={(s, e) => setTermDates(yearId, term.id, s, e)}
          />
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                if (!hasDateRange) {
                  setDateDialogOpen(true);
                  return;
                }
                // Default: Sunday, 07:00–08:00, first color
                setDraft({
                  title: "",
                  day: 0,
                  start: indexToHM(0),
                  end: indexToHM(2), // 1 hour
                  color: COLORS[0],
                });
                setOpen(true);
              }}
              title={!hasDateRange ? "Please set term dates first" : "Add new block"}
              className="bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                        text-gray-700 dark:text-gray-200 hover:from-green-50/90 hover:to-emerald-50/80 dark:hover:from-green-950/40 dark:hover:to-emerald-950/30 
                        hover:text-green-700 dark:hover:text-emerald-300 shadow-md hover:shadow-lg backdrop-blur-sm 
                        border border-gray-200/60 dark:border-gray-600/40 hover:border-green-200/60 dark:hover:border-emerald-400/30
                        transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0
                        font-medium tracking-wide rounded-2xl"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Block
            </Button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid mt-2 mb-1" style={{ gridTemplateColumns: "100px repeat(7, 1fr)" }}>
        <div />
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Weekly grid canvas */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white/80 dark:bg-neutral-900/60">
        <CardContent className="p-0 relative">
          {/* Date Range Required Overlay */}
          {!hasDateRange && (
            <div className="absolute inset-0 bg-black/5 dark:bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center p-4">
              <div className="bg-white/95 dark:bg-neutral-900/95 p-8 rounded-3xl shadow-2xl max-w-md text-center backdrop-blur-xl
                            border border-gray-200/60 dark:border-gray-600/40 ring-1 ring-gray-100/50 dark:ring-gray-700/50">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 
                                dark:from-blue-900/40 dark:to-indigo-900/40 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                      <path d="M8 2v4"/>
                      <path d="M16 2v4"/>
                      <rect width="18" height="18" x="3" y="4" rx="2"/>
                      <path d="M3 10h18"/>
                      <path d="M8 14h.01"/>
                      <path d="M12 14h.01"/>
                      <path d="M16 14h.01"/>
                      <path d="M8 18h.01"/>
                      <path d="M12 18h.01"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">Set Term Dates First</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    To add classes to your schedule and see them in today's dashboard, 
                    you must set the term date range first. This ensures proper scheduling 
                    and course tracking throughout the semester.
                  </p>
                </div>
                <Button 
                  onClick={() => setDateDialogOpen(true)}
                  className="rounded-2xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 dark:from-blue-500/90 dark:to-indigo-500/90
                            hover:from-blue-700/95 hover:to-indigo-700/95 dark:hover:from-blue-400/95 dark:hover:to-indigo-400/95
                            text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                            hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                            font-medium tracking-wide backdrop-blur-md px-6 py-3
                            ring-2 ring-blue-200/50 dark:ring-blue-400/30 hover:ring-blue-300/60 dark:hover:ring-blue-300/40"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M8 2v4"/>
                    <path d="M16 2v4"/>
                    <rect width="18" height="18" x="3" y="4" rx="2"/>
                    <path d="M3 10h18"/>
                  </svg>
                  Set Term Dates
                </Button>
              </div>
            </div>
          )}
          
          <div
            className="grid"
            style={{
              gridTemplateColumns: "100px repeat(7, 1fr)",
              gridTemplateRows: `repeat(${ROWS}, ${ROW_H}px)`,
            }}
          >
            {/* time column */}
            {Array.from({ length: ROWS }).map((_, r) => {
              const label = indexToHM(r);
              const mm = Number(label.slice(3));
              return (
                <div
                  key={`time-${r}`}
                  className={`border-r border-t border-black/5 dark:border-white/10 text-xs pr-2 flex items-start justify-end pt-1 ${
                    mm === 0 ? "bg-black/0" : ""
                  }`}
                  style={{ gridColumn: "1", gridRow: `${r + 1} / ${r + 2}` }}
                >
                  {mm === 0 ? label : ""}
                </div>
              );
            })}

            {/* Day columns (click to add) */}
            {DAYS.map((_, dayIdx) => (
              <div
                key={`col-${dayIdx}`}
                className="relative border-l border-black/5 dark:border-white/10"
                style={{ gridColumn: dayIdx + 2, gridRow: `1 / ${ROWS + 1}` }}
                onClick={(e) => onGridClick(dayIdx as DayIndex, e)}
              >
                {Array.from({ length: ROWS }).map((_, r) => (
                  <div
                    key={`bg-${dayIdx}-${r}`}
                    className={`border-t border-black/5 dark:border-white/10 ${
                      r % 2 ? "bg-black/5 dark:bg-white/5" : ""
                    }`}
                    style={{ height: ROW_H }}
                  />
                ))}

                {daysBlocks[dayIdx as DayIndex].map((b) => {
                  const y1 = hmToIndex(b.start);
                  const y2 = hmToIndex(b.end);
                  const top = y1 * ROW_H;
                  const height = Math.max(ROW_H, (y2 - y1) * ROW_H - 2);
                  return (
                    <button
                      key={b.id}
                      className="absolute left-1 right-1 rounded-xl p-2 text-center flex flex-col justify-center items-center shadow-md hover:shadow-lg transition border border-black/10 dark:border-white/10 overflow-hidden"
                      style={{ top, height, background: `${b.color ?? "#0ea5e9"}22` }}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setDraft({ ...b });
                        setOpen(true);
                      }}
                      title={`${b.title} • ${b.start}–${b.end}`}
                    >
                      {/* Course name */}
                      <div className="text-xs font-semibold leading-4 line-clamp-2">{b.title}</div>
                      
                      {/* Only show additional info if block is tall enough */}
                      {height > 60 && (
                        <>
                          {/* Course code */}
                          {b.courseCode && <div className="text-[10px] font-medium mt-0.5">{b.courseCode}</div>}
                          
                          {/* Room, building */}
                          {(b.room || b.building) && (
                            <div className="text-[10px] opacity-80">
                              {b.room && `${b.room}`}{b.room && b.building ? ", " : ""}
                              {b.building}
                            </div>
                          )}
                          
                          {/* Link (truncated) */}
                          {b.link && (
                            <div className="text-[10px] text-blue-500 opacity-80 truncate max-w-full">
                              {b.link.replace(/^https?:\/\//, '')}
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Time always shown */}
                      <div className="text-[10px] opacity-70 mt-0.5">
                        {b.start}–{b.end}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      {draft && (
        <BlockDialog
          open={open}
          onOpenChange={(b) => {
            setOpen(b);
            if (!b) setDraft(null);
          }}
          initial={draft}
          onSave={onSaveBlock}
          onDelete={
            draft.id
              ? () => {
                  if (draft?.id) {
                    removeSlot(yearId, term.id, draft.id);
                    setOpen(false);
                    setDraft(null);
                  }
                }
              : undefined
          }
        />
      )}

            {/* Term Date Dialog */}
      <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-white/95 dark:bg-neutral-800/95 backdrop-blur-xl border-0 shadow-2xl 
                                  ring-1 ring-gray-200/50 dark:ring-gray-600/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Set Term Date Range</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center mb-6">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-amber-50/80 dark:bg-amber-900/30 
                            border border-amber-200/60 dark:border-amber-700/40 text-amber-700 dark:text-amber-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-clock">
                <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/>
                <path d="M16 2v4"/>
                <path d="M8 2v4"/>
                <path d="M3 10h5"/>
                <circle cx="16" cy="16" r="6"/>
                <path d="M16 14v2l1 1"/>
              </svg>
              <span className="font-medium text-sm">Required for Schedule Tracking</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Setting the term dates enables proper class scheduling and ensures your courses 
              appear correctly in the Today's Schedule dashboard.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</Label>
              <Input 
                type="date" 
                value={term.startDate || ""} 
                onChange={(ev) => setTermDates(yearId, term.id, ev.target.value, term.endDate)}
                required
                className="rounded-2xl h-11 bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
                          focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
                          transition-all duration-300 backdrop-blur-md"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</Label>
              <Input 
                type="date" 
                value={term.endDate || ""} 
                onChange={(ev) => setTermDates(yearId, term.id, term.startDate, ev.target.value)}
                required
                className="rounded-2xl h-11 bg-white/80 dark:bg-neutral-800/80 border-gray-200/60 dark:border-gray-600/40 
                          focus:border-blue-400/60 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-200/50 dark:focus:ring-blue-400/20
                          transition-all duration-300 backdrop-blur-md"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button 
              onClick={() => setDateDialogOpen(false)}
              disabled={!term.startDate || !term.endDate}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 dark:from-blue-500/90 dark:to-indigo-500/90
                        hover:from-blue-700/95 hover:to-indigo-700/95 dark:hover:from-blue-400/95 dark:hover:to-indigo-400/95
                        disabled:from-gray-400/80 disabled:to-gray-500/80 dark:disabled:from-gray-600/80 dark:disabled:to-gray-700/80
                        text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                        hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                        disabled:hover:scale-100 disabled:hover:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed
                        font-medium tracking-wide backdrop-blur-md h-12
                        ring-2 ring-blue-200/50 dark:ring-blue-400/30 hover:ring-blue-300/60 dark:hover:ring-blue-300/40
                        disabled:ring-gray-300/30 dark:disabled:ring-gray-600/30"
            >
              {term.startDate && term.endDate ? 'Save & Continue' : 'Set Both Dates to Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TermColumn({ yearId, termIndex }: { yearId: string; termIndex: number }) {
  const years = useSchedule((s) => s.years);
  const year = years.find((y) => y.id === yearId);
  const term = year?.terms?.[termIndex];
  if (!year || !term) return null;
  return <TermColumnBody yearId={yearId} term={term} />;
}

// ---------- Inline top tabs (beside title) ----------
function TopTabsInline() {
  const navigate = useNavigate();
  const tabs = [
    { label: "Dashboard", path: "/" },
    { label: "Academic Planner", path: "/planner" }, // wire later
    { label: "Task Tracker", path: "/tasks" }, // wire later
    { label: "Schedule Planner", path: "/schedule", active: true },
    { label: "Course Planner", path: "/courses" }, // wire later    
    { label: "Scholarships", path: "/scholarships" }, // wire later
    { label: "Textbooks", path: "/textbooks" }, // wire later
    { label: "Settings", path: "/settings" }, // wire later
  ];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tabs.map((t) => (
        <Button
          key={t.label}
          variant={t.active ? "default" : "outline"}
          className={`h-9 rounded-full transition-all duration-200 font-medium tracking-wide text-xs
            ${t.active 
              ? "bg-gradient-to-r from-blue-600/90 to-indigo-600/90 dark:from-blue-500/90 dark:to-indigo-500/90 text-white shadow-lg ring-2 ring-blue-200/50 dark:ring-blue-400/30 backdrop-blur-sm hover:from-blue-700/95 hover:to-indigo-700/95 dark:hover:from-blue-400/95 dark:hover:to-indigo-400/95" 
              : "bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 text-gray-700 dark:text-gray-200 hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 hover:text-blue-700 dark:hover:text-blue-300 shadow-md hover:shadow-lg backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/40 hover:border-blue-200/60 dark:hover:border-blue-400/30"
            }
            hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0`}
          onClick={() => navigate(t.path)}
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
}

// ---------- Main Page ----------
export default function SchedulePlanner() {
  const years = useSchedule((s) => s.years);
  const selectedYearId = useSchedule((s) => s.selectedYearId);
  const yearRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const setSelectedYear = useSchedule((s) => s.setSelectedYear);
  const addYear = useSchedule((s) => s.addYear);
  const removeYear = useSchedule((s) => s.removeYear);
  const setTermsCount = useSchedule((s) => s.setTermsCount);

  const activeYearId = selectedYearId || years[0]?.id;
  const year = years.find((y) => y.id === activeYearId);

  // year chooser button (top-right)
  const [yearOpen, setYearOpen] = React.useState(false);
  
  // delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [yearToDelete, setYearToDelete] = React.useState<{id: string, label: string} | null>(null);

  // directly under your existing hooks (years, selectedYearId, etc.)
  const theme = useTheme();
  const THEME_COLORS = PALETTES[theme.palette];
  const [accentLocal, setAccentLocal] = React.useState(theme.accent);
  React.useEffect(() => setAccentLocal(theme.accent), [theme.accent]);

  const bgStyle = React.useMemo(() => {
    const alpha = Math.min(0.35, Math.max(0.12, accentLocal / 260));
    const hex = Math.round(alpha * 255).toString(16).padStart(2, "0");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme.mode === "dark" || (theme.mode === "system" && prefersDark);
    const base = isDark
      ? "linear-gradient(135deg, #0b0f19 0%, #0a0a0a 70%)"
      : "linear-gradient(135deg, #ffffff 0%, #f8fbff 65%)";
    const tintA = `radial-gradient(circle at 10% 0%, ${THEME_COLORS[0]}${hex} 0%, transparent 40%)`;
    const tintB = `radial-gradient(circle at 90% 10%, ${THEME_COLORS[3]}${hex} 0%, transparent 45%)`;
    const tintC = `radial-gradient(circle at 50% 120%, ${THEME_COLORS[2]}${hex} 0%, transparent 55%)`;
    return {
      backgroundImage: `${tintA}, ${tintB}, ${tintC}, ${base}`,
      backgroundRepeat: "no-repeat, no-repeat, no-repeat, no-repeat",
      backgroundAttachment: "fixed, fixed, scroll, fixed",
      backgroundPosition: "10% 0%, 90% 10%, 50% 100%, 0 0",
    } as React.CSSProperties;
  }, [accentLocal, theme.mode, THEME_COLORS]);

    // Calculate next school year label based on existing years
  const getNextYearLabel = () => {
    if (years.length === 0) return "SY 2025–2026";
    
    // Find the highest year number
    let maxYear = 2025;
    years.forEach(y => {
      // Extract years from labels like "SY 2025–2026"
      const match = y.label.match(/SY (\d{4})–(\d{4})/);
      if (match) {
        const startYear = parseInt(match[1], 10);
        if (startYear > maxYear) maxYear = startYear;
      }
    });
    
    // Generate next SY label
    return `SY ${maxYear + 1}–${maxYear + 2}`;
  };

  return (
    <div className="min-h-screen w-full" style={bgStyle}>
      <style>{scrollbarStyles}</style>
      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
        {/* Top header: title on the left, school year chip on the right */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5" />
              <h1 className="text-2xl font-bold">Schedule Planner</h1>
            </div>
            <TopTabsInline />
          </div>

          <Button
            variant="outline"
            className="rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                      text-gray-700 dark:text-gray-200 hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 
                      hover:text-blue-700 dark:hover:text-blue-300 shadow-md hover:shadow-lg backdrop-blur-sm 
                      border border-gray-200/60 dark:border-gray-600/40 hover:border-blue-200/60 dark:hover:border-blue-400/30
                      transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5 active:translate-y-0
                      font-medium tracking-wide"
            onClick={() => setYearOpen(true)}
            title="Select school year"
          >
            {year?.label || "Choose School Year"} <span className="ml-1 opacity-60">▼</span>
          </Button>
        </div>

        {/* Year chooser dialog */}
        <Dialog open={yearOpen} onOpenChange={setYearOpen}>
            <DialogContent className="max-w-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
              <DialogHeader className="pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Select School Year
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-80 overflow-auto py-3 px-1">
                {years.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 text-center bg-gray-50/50 dark:bg-neutral-800/50 rounded-xl">
                    No school years added yet. Add your first school year below.
                  </div>
                ) : (
                  years.map((y) => (
                    <div key={y.id} className="flex items-center gap-3 group px-1">
                      <Button
                        variant={y.id === activeYearId ? "default" : "outline"}
                        className={`flex-1 justify-start rounded-2xl transition-all duration-200 font-medium tracking-wide h-12
                          ${y.id === activeYearId 
                            ? "bg-gradient-to-r from-blue-600/90 to-indigo-600/90 dark:from-blue-500/90 dark:to-indigo-500/90 text-white shadow-lg ring-2 ring-blue-200/50 dark:ring-blue-400/30 backdrop-blur-sm hover:from-blue-700/95 hover:to-indigo-700/95 dark:hover:from-blue-400/95 dark:hover:to-indigo-400/95" 
                            : "bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 text-gray-700 dark:text-gray-200 hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 hover:text-blue-700 dark:hover:text-blue-300 shadow-md hover:shadow-lg backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/40 hover:border-blue-200/60 dark:hover:border-blue-400/30"
                          }
                          hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0`}
                        onClick={() => {
                          setSelectedYear(y.id);
                          setYearOpen(false);
                          // Scroll to the selected year
                          setTimeout(() => {
                            yearRefs.current[y.id]?.scrollIntoView({ 
                              behavior: 'smooth',
                              block: 'start' 
                            });
                          }, 10);
                        }}
                      >
                        {y.label}
                      </Button>
                      {years.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-12 w-12 p-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 
                                    hover:bg-red-50/50 dark:hover:bg-red-950/30 rounded-2xl transition-all duration-300
                                    opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95
                                    ring-1 ring-red-200/50 dark:ring-red-800/50 hover:ring-red-300/60 dark:hover:ring-red-700/60"
                          onClick={() => {
                            setYearToDelete({id: y.id, label: y.label});
                            setDeleteConfirmOpen(true);
                          }}
                          title={`Delete ${y.label}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
              <DialogFooter className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <Button
                  onClick={() => {
                    const newLabel = getNextYearLabel();
                    addYear(newLabel);
                    setYearOpen(false);
                    setTimeout(() => {
                      const last = years[years.length - 1];
                      if (last?.id) {
                        setSelectedYear(last.id);
                        yearRefs.current[last.id]?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 10);
                  }}
                  className="rounded-2xl bg-gradient-to-r from-green-600/90 to-emerald-600/90 dark:from-green-500/90 dark:to-emerald-500/90
                            hover:from-green-700/95 hover:to-emerald-700/95 dark:hover:from-green-400/95 dark:hover:to-emerald-400/95
                            text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                            hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0
                            font-medium tracking-wide backdrop-blur-md
                            ring-2 ring-green-200/50 dark:ring-green-400/30 hover:ring-green-300/60 dark:hover:ring-green-300/40"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add School Year
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete confirmation dialog */}
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent className="max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
              <DialogHeader className="pb-4 border-b border-red-200/50 dark:border-red-800/50">
                <DialogTitle className="text-xl font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Delete School Year
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Are you sure you want to delete <strong>{yearToDelete?.label}</strong>?
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200/50 dark:border-red-800/50">
                  ⚠️ This will permanently delete all terms, courses, and schedules for this school year. This action cannot be undone.
                </p>
              </div>
              <DialogFooter className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setYearToDelete(null);
                  }}
                  className="rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                            text-gray-700 dark:text-gray-200 hover:from-gray-50/90 hover:to-gray-100/80 dark:hover:from-gray-750/40 dark:hover:to-gray-850/30 
                            shadow-md hover:shadow-lg backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/40
                            transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-medium tracking-wide"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (yearToDelete) {
                      removeYear(yearToDelete.id);
                      setDeleteConfirmOpen(false);
                      setYearToDelete(null);
                      setYearOpen(false);
                    }
                  }}
                  className="rounded-2xl bg-gradient-to-r from-red-600/90 to-red-700/90 dark:from-red-500/90 dark:to-red-600/90
                            hover:from-red-700/95 hover:to-red-800/95 dark:hover:from-red-400/95 dark:hover:to-red-500/95
                            text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 
                            hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0
                            font-medium tracking-wide backdrop-blur-md
                            ring-2 ring-red-200/50 dark:ring-red-400/30 hover:ring-red-300/60 dark:hover:ring-red-300/40"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Only one school year is shown; only first two terms are visible */}
        <div className="space-y-6">
          {years.map((year) => (
            <div 
              key={year.id} 
              className="space-y-4"
              ref={(el) => {
                yearRefs.current[year.id] = el;
              }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">{year.label}</h2>
              </div>

              <div className="flex"> {/* Flex container for canvas + button */}
                {/* Scrollable terms container */}
                  <div className={`overflow-x-auto flex-1 ${
                    theme.mode === "dark" || (theme.mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
                      ? "dark-scrollbar" 
                      : "light-scrollbar"
                  }`}>
                  <div className="flex gap-6 items-start min-w-max">
                    {year.terms.map((_, idx) => (
                      <div key={idx} className="min-w-[950px]">
                        <TermColumn yearId={year.id} termIndex={idx} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fixed-position add-term button outside scroll area */}
                <div className="ml-4 w-[120px] shrink-0 flex flex-col">
                  <div className="h-8 mb-12"></div>
                  <button
                    className="w-full rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                              text-gray-700 dark:text-gray-200 hover:from-green-50/90 hover:to-emerald-50/80 dark:hover:from-green-950/40 dark:hover:to-emerald-950/30 
                              hover:text-green-700 dark:hover:text-emerald-300 shadow-md hover:shadow-lg backdrop-blur-sm 
                              border border-gray-200/60 dark:border-gray-600/40 hover:border-green-200/60 dark:hover:border-emerald-400/30
                              transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0
                              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0
                              disabled:hover:from-white/95 disabled:hover:to-white/85 dark:disabled:hover:from-neutral-800/80 dark:disabled:hover:to-neutral-900/70"
                    style={{ 
                      height: GRID_PX + 56 - 32, // Canvas height minus padding (header=24px + weekday row=32px - section padding)
                    }}
                    onClick={() => setTermsCount(year.id, Math.min(4, (year.terms.length + 1) as 2 | 3 | 4) as 2 | 3 | 4)}
                    title={year.terms.length >= 4 ? "Max 4 terms" : "Add new term"}
                    disabled={year.terms.length >= 4}
                  >
                    <span className="block rotate-90 whitespace-nowrap text-lg md:text-xl font-semibold tracking-wide select-none">
                      + Add New Term
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-4 pb-8">
            <Button
              className="w-full h-24 rounded-2xl bg-gradient-to-r from-white/95 to-white/85 dark:from-neutral-800/80 dark:to-neutral-900/70 
                        text-gray-700 dark:text-gray-200 hover:from-blue-50/90 hover:to-indigo-50/80 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/30 
                        hover:text-blue-700 dark:hover:text-blue-300 shadow-md hover:shadow-lg backdrop-blur-sm 
                        border border-gray-200/60 dark:border-gray-600/40 hover:border-blue-200/60 dark:hover:border-blue-400/30
                        transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] hover:-translate-y-0.5 active:translate-y-0
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0
                        disabled:hover:from-white/95 disabled:hover:to-white/85 dark:disabled:hover:from-neutral-800/80 dark:disabled:hover:to-neutral-900/70
                        font-semibold tracking-wide"
              onClick={() => {
                const newLabel = getNextYearLabel();
                console.log("Adding new year:", newLabel);
                addYear(newLabel);
                setTimeout(() => {
                  const lastYear = years[years.length - 1];
                  console.log("Years after adding:", years.length, lastYear?.id);
                  if (lastYear?.id) {
                    setSelectedYear(lastYear.id);
                    yearRefs.current[lastYear.id]?.scrollIntoView({ behavior: 'smooth' });
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
