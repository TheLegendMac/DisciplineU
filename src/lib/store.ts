import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Goal, Habit, HabitDraft, PlanDraft, Tone, WeeklyReview } from "./types";
import type { Completion } from "./types";
import { todayKey } from "./dates";
import { buildDemoData } from "./demo";
import { haptic } from "./haptics";

let idCounter = 0;
export function uid(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}${Math.random().toString(36).slice(2, 6)}`;
}

interface AppState {
  onboarded: boolean;
  demo: boolean;
  tone: Tone;
  theme: "dark" | "light";
  reminders: boolean;
  goals: Goal[];
  completions: Completion[];
  reviews: WeeklyReview[];
  journal: Record<string, string>; // date key → one-line note

  setTheme: (t: "dark" | "light") => void;
  setTone: (t: Tone) => void;
  setReminders: (on: boolean) => void;
  setJournal: (date: string, text: string) => void;
  importAll: (raw: unknown) => boolean;
  completeOnboarding: () => void;
  adoptPlan: (draft: PlanDraft, purpose: string, purposeAI: boolean) => string;
  toggleHabit: (habitId: string, date: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  updateHabit: (goalId: string, habitId: string, patch: Partial<Habit>) => void;
  replaceHabit: (goalId: string, habitId: string, draft: HabitDraft) => void;
  removeHabit: (goalId: string, habitId: string) => void;
  setGoalStatus: (goalId: string, status: Goal["status"]) => void;
  setPurpose: (goalId: string, purpose: string) => void;
  addReview: (review: WeeklyReview) => void;
  seedDemo: () => void;
  resetAll: () => void;
}

const EMPTY = {
  onboarded: false,
  demo: false,
  tone: "balanced" as Tone,
  theme: "dark" as const,
  reminders: false,
  goals: [] as Goal[],
  completions: [] as Completion[],
  reviews: [] as WeeklyReview[],
  journal: {} as Record<string, string>,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...EMPTY,

      setTheme: (theme) => set({ theme }),
      setTone: (tone) => set({ tone }),
      setReminders: (reminders) => set({ reminders }),
      completeOnboarding: () => set({ onboarded: true }),

      setJournal: (date, text) =>
        set((s) => {
          const journal = { ...s.journal };
          if (text.trim()) journal[date] = text.trim();
          else delete journal[date];
          return { journal };
        }),

      // Accepts a parsed export file — either the raw persist envelope
      // ({ state, version }) or a bare state object.
      importAll: (raw) => {
        const candidate =
          raw && typeof raw === "object" && "state" in raw
            ? (raw as { state: unknown }).state
            : raw;
        if (!candidate || typeof candidate !== "object") return false;
        const data = candidate as Record<string, unknown>;
        if (!Array.isArray(data.goals)) return false;
        set({
          onboarded: Boolean(data.onboarded),
          demo: Boolean(data.demo),
          tone: data.tone === "gentle" || data.tone === "direct" ? data.tone : "balanced",
          theme: data.theme === "light" ? "light" : "dark",
          reminders: Boolean(data.reminders),
          goals: data.goals as Goal[],
          completions: Array.isArray(data.completions) ? (data.completions as Completion[]) : [],
          reviews: Array.isArray(data.reviews) ? (data.reviews as WeeklyReview[]) : [],
          journal:
            data.journal && typeof data.journal === "object" && !Array.isArray(data.journal)
              ? (data.journal as Record<string, string>)
              : {},
        });
        return true;
      },

      adoptPlan: (draft, purpose, purposeAI) => {
        const goalId = uid("goal");
        const goal: Goal = {
          id: goalId,
          input: draft.input,
          title: draft.title,
          identity: draft.identity,
          category: draft.category,
          purpose,
          purposeAI,
          habits: draft.habits.map((hd) => ({ ...hd, id: uid("habit"), status: "active" })),
          milestones: draft.milestones.map((title, i) => ({
            id: uid("ms"),
            title,
            week: i + 1,
            done: false,
          })),
          status: "active",
          createdAt: todayKey(),
        };
        set((s) => ({ goals: [...s.goals, goal], onboarded: true }));
        return goalId;
      },

      toggleHabit: (habitId, date) => {
        const completing = !get().completions.some(
          (c) => c.habitId === habitId && c.date === date,
        );
        if (completing) haptic("complete");
        set((s) => {
          const exists = s.completions.some((c) => c.habitId === habitId && c.date === date);
          return {
            completions: exists
              ? s.completions.filter((c) => !(c.habitId === habitId && c.date === date))
              : [...s.completions, { habitId, date }],
          };
        });
      },

      toggleMilestone: (goalId, milestoneId) => {
        const milestone = get()
          .goals.find((g) => g.id === goalId)
          ?.milestones.find((m) => m.id === milestoneId);
        if (milestone && !milestone.done) haptic("complete");
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  milestones: g.milestones.map((m) =>
                    m.id === milestoneId ? { ...m, done: !m.done } : m,
                  ),
                }
              : g,
          ),
        }));
      },

      updateHabit: (goalId, habitId, patch) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  habits: g.habits.map((hb) => (hb.id === habitId ? { ...hb, ...patch } : hb)),
                }
              : g,
          ),
        })),

      replaceHabit: (goalId, habitId, draft) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  habits: g.habits.map((hb) =>
                    hb.id === habitId ? { ...hb, ...draft } : hb,
                  ),
                }
              : g,
          ),
        })),

      removeHabit: (goalId, habitId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId ? { ...g, habits: g.habits.filter((hb) => hb.id !== habitId) } : g,
          ),
        })),

      setGoalStatus: (goalId, status) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === goalId ? { ...g, status } : g)),
        })),

      setPurpose: (goalId, purpose) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId ? { ...g, purpose, purposeAI: false } : g,
          ),
        })),

      addReview: (review) => set((s) => ({ reviews: [review, ...s.reviews] })),

      seedDemo: () => {
        const data = buildDemoData();
        set({ ...data, demo: true, onboarded: true });
      },

      resetAll: () => set({ ...EMPTY }),
    }),
    { name: "disciplineu-v1", version: 1 },
  ),
);
