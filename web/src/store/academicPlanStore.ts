import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CourseRow = {
  id: string;
  code: string;
  name: string;
  section: string;
  credits: number;
  gpa?: number;
};

export type PlanTerm = {
  id: string;
  name: string; // Term 1, Term 2, ...
  courses: CourseRow[];
};

export type PlanYear = {
  id: string;
  label: string; // SY 2025–2026
  terms: PlanTerm[];
};

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function blankRow(): CourseRow {
  return { id: uid("row"), code: "", name: "", section: "", credits: 0, gpa: undefined };
}

function makeTerms(n: 2 | 3 | 4): PlanTerm[] {
  return new Array(n).fill(null).map((_, i) => ({
    id: uid("term"),
    name: `Term ${i + 1}`,
    courses: Array.from({ length: 8 }, () => blankRow()), // default 8 rows
  }));
}

const defaultYear = (): PlanYear => {
  const y = new Date().getFullYear();
  return { id: uid("year"), label: `SY ${y}–${y + 1}`, terms: makeTerms(2) };
};

export type AcademicPlanState = {
  years: PlanYear[];
  selectedYearId?: string;

  setSelectedYear: (id: string) => void;
  addYear: (label?: string, termsCount?: 2 | 3 | 4) => void;
  setTermsCount: (yearId: string, count: 2 | 3 | 4) => void;

  addRow: (yearId: string, termId: string) => void;
  updateRow: (yearId: string, termId: string, row: CourseRow) => void;
  removeRow: (yearId: string, termId: string, rowId: string) => void;
};

export const useAcademicPlan = create<AcademicPlanState>()(
  persist(
    (set, get) => ({
      years: [defaultYear()],
      selectedYearId: undefined,

      setSelectedYear: (id) => set({ selectedYearId: id }),

      addYear: (label, termsCount = 2) =>
        set((s) => ({
          years: [
            ...s.years,
            {
              id: uid("year"),
              label: label || defaultYear().label,
              terms: makeTerms(termsCount),
            },
          ],
        })),

      setTermsCount: (yearId, count) =>
        set((s) => ({
          years: s.years.map((y) => {
            if (y.id !== yearId) return y;
            const next = makeTerms(count);
            // carry over rows into corresponding terms when possible
            y.terms.forEach((t, i) => {
              if (next[i]) next[i].courses = t.courses;
            });
            return { ...y, terms: next };
          }),
        })),

      addRow: (yearId, termId) =>
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
                          courses: [
                            ...t.courses,
                            { id: uid("row"), code: "", name: "", section: "", credits: 0 },
                          ],
                        }
                  ),
                }
          ),
        })),

      updateRow: (yearId, termId, row) =>
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
                          courses: t.courses.map((r) => (r.id === row.id ? row : r)),
                        }
                  ),
                }
          ),
        })),

      removeRow: (yearId, termId, rowId) =>
        set((s) => ({
          years: s.years.map((y) =>
            y.id !== yearId
              ? y
              : {
                  ...y,
                  terms: y.terms.map((t) =>
                    t.id !== termId
                      ? t
                      : { ...t, courses: t.courses.filter((r) => r.id !== rowId) }
                  ),
                }
          ),
        })),
    }),
    { name: "aq:academic-plan" }
  )
);
