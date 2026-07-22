export type Category =
  | "health"
  | "fitness"
  | "career"
  | "learning"
  | "productivity"
  | "finance"
  | "social"
  | "creativity"
  | "mindfulness"
  | "general";

export type Tone = "gentle" | "balanced" | "direct";

export type TimeHint = "morning" | "afternoon" | "evening" | "anytime";

export type Cadence = { type: "daily" } | { type: "weekly"; times: number };

export interface HabitDraft {
  title: string;
  why: string;
  cadence: Cadence;
  timeHint: TimeHint;
}

export interface Habit extends HabitDraft {
  id: string;
  status: "active" | "paused";
  time?: string; // optional exact time, 24h "HH:MM"
}

export interface Milestone {
  id: string;
  title: string;
  week: number;
  done: boolean;
}

export interface Goal {
  id: string;
  input: string;
  title: string;
  identity: string;
  category: Category;
  purpose: string;
  purposeAI: boolean;
  habits: Habit[];
  milestones: Milestone[];
  status: "active" | "paused" | "archived";
  createdAt: string; // YYYY-MM-DD
}

export interface Completion {
  habitId: string;
  date: string; // YYYY-MM-DD
}

export interface WeeklyReview {
  id: string;
  date: string;
  worked: string[]; // habit titles that felt good
  hard: string[]; // habit titles that felt hard
  note: string;
  prioritiesChanged: boolean;
  summary: string;
  changes: string[];
}

export interface PlanDraft {
  input: string;
  title: string;
  identity: string;
  category: Category;
  purpose: string;
  habits: HabitDraft[];
  milestones: string[];
  careNote?: string;
  crisis?: boolean;
}
