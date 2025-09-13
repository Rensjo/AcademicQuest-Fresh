// src/store/scheduleStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { rewardScheduleSetup } from "./gamificationHelpers";

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sun..Sat

export type Slot = {
  id: string;
  title: string;          // agenda / course name
  courseCode?: string;
  room?: string;
  building?: string;
  link?: string;
  day: DayIndex;          // 0..6
  start: string;          // "HH:MM" 24h
  end: string;            // "HH:MM" 24h
  color?: string;         // hex
};

export type Term = {
  id: string;
  name: string;           // "Term 1"
  startDate?: string;     // "YYYY-MM-DD"
  endDate?: string;       // "YYYY-MM-DD"
  slots: Slot[];
};

export type AcademicYear = {
  id: string;
  label: string;          // "SY 2025–2026"
  terms: Term[];
};

type ScheduleState = {
  years: AcademicYear[];
  selectedYearId?: string;

  setSelectedYear: (id: string) => void;
  addYear: (label?: string, termsCount?: 2 | 3 | 4) => void;
  removeYear: (yearId: string) => void;
  setTermsCount: (yearId: string, count: 2 | 3 | 4) => void;
  setTermDates: (yearId: string, termId: string, start?: string, end?: string) => void;

  addSlot: (yearId: string, termId: string, slot: Omit<Slot, "id">) => void;
  updateSlot: (yearId: string, termId: string, slot: Slot) => void;
  removeSlot: (yearId: string, termId: string, slotId: string) => void;

  getActiveTermForDate: (d: Date) => { year?: AcademicYear; term?: Term } | undefined;
  todaySlots: () => Array<{ time: string; course: string; room?: string }>;
};

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function makeTerms(count: 2 | 3 | 4): Term[] {
  return new Array(count).fill(null).map((_, i) => ({
    id: uid("term"),
    name: `Term ${i + 1}`,
    startDate: undefined,
    endDate: undefined,
    slots: [],
  }));
}

const defaultYear = (): AcademicYear => {
  const y = new Date().getFullYear();
  return {
    id: uid("year"),
    label: `SY ${y}–${y + 1}`,
    terms: makeTerms(2),
  };
};

// (helper removed; not used)

export const useSchedule = create<ScheduleState>()(
  persist(
    (set, get) => ({
      years: [defaultYear()],
      selectedYearId: undefined,

      setSelectedYear: (id) => set({ selectedYearId: id }),

      addYear: (label, termsCount = 2) =>
        set((s) => {
          const y = new Date().getFullYear();
          return {
            years: [
              ...s.years,
              {
                id: uid("year"),
                label: label || `SY ${y}–${y + 1}`,
                terms: makeTerms(termsCount),
              },
            ],
          };
        }),

      removeYear: (yearId) =>
        set((s) => {
          const updatedYears = s.years.filter((y) => y.id !== yearId);
          // If removing the selected year, reset selection
          const newSelectedYearId = s.selectedYearId === yearId ? updatedYears[0]?.id : s.selectedYearId;
          return {
            years: updatedYears,
            selectedYearId: newSelectedYearId,
          };
        }),

      setTermsCount: (yearId, count) =>
        set((s) => ({
          years: s.years.map((y) => {
            if (y.id !== yearId) return y;
            const newTerms = makeTerms(count);
            // carry over existing slots to corresponding new terms where possible
            y.terms.forEach((t, i) => {
              if (newTerms[i]) newTerms[i].slots = t.slots;
            });
            return { ...y, terms: newTerms };
          }),
        })),

      setTermDates: (yearId, termId, start, end) =>
        set((s) => ({
          years: s.years.map((y) =>
            y.id !== yearId
              ? y
              : {
                  ...y,
                  terms: y.terms.map((t) =>
                    t.id !== termId ? t : { ...t, startDate: start, endDate: end }
                  ),
                }
          ),
        })),

      addSlot: (yearId, termId, slot) =>
        set((s) => {
          const newState = {
            years: s.years.map((y) =>
              y.id !== yearId
                ? y
                : {
                    ...y,
                    terms: y.terms.map((t) =>
                      t.id !== termId
                        ? t
                        : { ...t, slots: [...t.slots, { id: uid("slot"), ...slot }] }
                    ),
                  }
            ),
          };
          
          // Check if this creates a complete weekly schedule (5+ slots across different days)
          setTimeout(() => {
            const year = newState.years.find(y => y.id === yearId);
            const term = year?.terms.find(t => t.id === termId);
            if (term && term.slots.length >= 5) {
              const uniqueDays = new Set(term.slots.map(s => s.day));
              if (uniqueDays.size >= 5) {
                rewardScheduleSetup();
              }
            }
          }, 0);
          
          return newState;
        }),

      updateSlot: (yearId, termId, slot) =>
        set((s) => ({
          years: s.years.map((y) =>
            y.id !== yearId
              ? y
              : {
                  ...y,
                  terms: y.terms.map((t) =>
                    t.id !== termId
                      ? t
                      : {
                          ...t,
                          slots: t.slots.map((sl) => (sl.id === slot.id ? slot : sl)),
                        }
                  ),
                }
          ),
        })),

      removeSlot: (yearId, termId, slotId) =>
        set((s) => ({
          years: s.years.map((y) =>
            y.id !== yearId
              ? y
              : {
                  ...y,
                  terms: y.terms.map((t) =>
                    t.id !== termId
                      ? t
                      : { ...t, slots: t.slots.filter((sl) => sl.id !== slotId) }
                  ),
                }
          ),
        })),

      getActiveTermForDate: (d: Date) => {
        const ymd = d.toISOString().slice(0, 10);
        for (const y of get().years) {
          for (const t of y.terms) {
            if (!t.startDate || !t.endDate) continue;
            if (t.startDate <= ymd && ymd <= t.endDate) {
              return { year: y, term: t };
            }
          }
        }
        return undefined;
      },

  todaySlots: () => {
        const d = new Date();
        const dow = d.getDay() as DayIndex;
        const s = get();

        // Prefer an active term by date…
        const active = s.getActiveTermForDate(d);
        // …but fall back to the first term of the selected (or first) year
        const fallbackYear = s.years.find(y => y.id === s.selectedYearId) ?? s.years[0];
        const term = active?.term ?? fallbackYear?.terms[0];

        const slots = term?.slots.filter(sl => sl.day === dow) ?? [];
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
          }));
      }
      }),
    { name: "aq:schedule" }
  )
);
