import type { Completion, Goal, Habit, Milestone } from "./types";
import { addDays, daysBetween, lastNDays, weekStart } from "./dates";

export interface TodayAction {
  goal: Goal;
  habit: Habit;
  done: boolean;
  weekLabel?: string; // "2 of 3 this week" for weekly habits
}

export type DayPart = "morning" | "afternoon" | "evening" | "anytime";

const PART_ORDER: Record<DayPart, number> = { morning: 0, afternoon: 1, evening: 2, anytime: 3 };

export const PART_LABELS: Record<DayPart, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  anytime: "Anytime",
};

// An exact time places the action in its clock bucket; otherwise the
// habit's loose hint decides.
export function dayPart(habit: Habit): DayPart {
  if (habit.time) {
    if (habit.time < "12:00") return "morning";
    if (habit.time < "17:00") return "afternoon";
    return "evening";
  }
  return habit.timeHint;
}

export function groupByDayPart(
  actions: TodayAction[],
): { part: DayPart; label: string; actions: TodayAction[] }[] {
  return (Object.keys(PART_ORDER) as DayPart[])
    .map((part) => ({
      part,
      label: PART_LABELS[part],
      actions: actions.filter((a) => dayPart(a.habit) === part),
    }))
    .filter((g) => g.actions.length > 0);
}

export function isDoneOn(completions: Completion[], habitId: string, date: string): boolean {
  return completions.some((c) => c.habitId === habitId && c.date === date);
}

export function completionsThisWeek(completions: Completion[], habitId: string, today: string): number {
  const start = weekStart(today);
  return completions.filter((c) => c.habitId === habitId && c.date >= start && c.date <= today).length;
}

export function activeGoals(goals: Goal[]): Goal[] {
  return goals.filter((g) => g.status === "active");
}

export function todayActions(goals: Goal[], completions: Completion[], today: string): TodayAction[] {
  const actions: TodayAction[] = [];
  for (const goal of activeGoals(goals)) {
    for (const habit of goal.habits) {
      if (habit.status !== "active") continue;
      const done = isDoneOn(completions, habit.id, today);
      if (habit.cadence.type === "daily") {
        actions.push({ goal, habit, done });
      } else {
        const count = completionsThisWeek(completions, habit.id, today);
        // Weekly habits stay listed until the weekly target is met; a habit
        // completed today stays visible (checked) even if it hit the target.
        if (count < habit.cadence.times || done) {
          actions.push({
            goal,
            habit,
            done,
            weekLabel: `${count} of ${habit.cadence.times} this week`,
          });
        }
      }
    }
  }
  // Undone first; then by part of day; within a part, timed actions in
  // clock order ahead of untimed ones.
  actions.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const partDiff = PART_ORDER[dayPart(a.habit)] - PART_ORDER[dayPart(b.habit)];
    if (partDiff !== 0) return partDiff;
    return (a.habit.time ?? "99:99").localeCompare(b.habit.time ?? "99:99");
  });
  return actions;
}

export function nextAction(actions: TodayAction[]): TodayAction | undefined {
  return actions.find((a) => !a.done);
}

// Expected actions this week vs completed, over the trailing 7 days.
// Deliberately weekly, not a daily streak: one missed day cannot zero it.
export function consistency7(goals: Goal[], completions: Completion[], today: string): number | null {
  let expected = 0;
  const habitIds: string[] = [];
  for (const goal of activeGoals(goals)) {
    const age = daysBetween(goal.createdAt, today) + 1;
    const scale = Math.min(age, 7) / 7; // young goals aren't penalized for days before they existed
    for (const habit of goal.habits) {
      if (habit.status !== "active") continue;
      habitIds.push(habit.id);
      expected += (habit.cadence.type === "daily" ? 7 : habit.cadence.times) * scale;
    }
  }
  if (expected === 0) return null;
  const start = addDays(today, -6);
  const done = completions.filter(
    (c) => habitIds.includes(c.habitId) && c.date >= start && c.date <= today,
  ).length;
  return Math.min(100, Math.round((done / expected) * 100));
}

// Consecutive weeks (ending with the current week) with at least one completion.
export function weeksShowingUp(completions: Completion[], today: string): number {
  if (completions.length === 0) return 0;
  const weeks = new Set(completions.map((c) => weekStart(c.date)));
  let count = 0;
  let cursor = weekStart(today);
  while (weeks.has(cursor)) {
    count++;
    cursor = addDays(cursor, -7);
  }
  return count;
}

// True when the user had an active plan but completed nothing for 2+ days.
export function needsRecovery(goals: Goal[], completions: Completion[], today: string): boolean {
  const active = activeGoals(goals);
  if (active.length === 0) return false;
  const oldest = active.reduce((min, g) => (g.createdAt < min ? g.createdAt : min), today);
  if (daysBetween(oldest, today) < 3) return false;
  if (completions.some((c) => c.date === today)) return false;
  const y1 = addDays(today, -1);
  const y2 = addDays(today, -2);
  return !completions.some((c) => c.date === y1 || c.date === y2);
}

export function currentMilestone(goal: Goal): Milestone | undefined {
  return goal.milestones.find((m) => !m.done);
}

export function totalCompletions(completions: Completion[]): number {
  return completions.length;
}

export interface DayCell {
  date: string;
  state: "done" | "partial" | "missed" | "none" | "future";
}

// done = all due actions completed, partial = some, missed = active plan
// but nothing done, none = no plan existed yet, future = hasn't happened.
function dayState(goals: Goal[], completions: Completion[], date: string): DayCell {
  const active = activeGoals(goals);
  const existed = active.some((g) => g.createdAt <= date);
  if (!existed) return { date, state: "none" };
  const dailyDue = active.flatMap((g) =>
    g.habits.filter((h) => h.status === "active" && h.cadence.type === "daily" && g.createdAt <= date),
  ).length;
  const doneCount = completions.filter((c) => c.date === date).length;
  if (doneCount === 0) return { date, state: "missed" };
  if (dailyDue > 0 && doneCount < dailyDue) return { date, state: "partial" };
  return { date, state: "done" };
}

// 14-day activity strip for the Progress page.
export function activityStrip(goals: Goal[], completions: Completion[], today: string): DayCell[] {
  return lastNDays(14, today).map((date) => dayState(goals, completions, date));
}

// Contribution-style grid: one column per week (oldest first), each
// column Monday→Sunday.
export function activityGrid(
  goals: Goal[],
  completions: Completion[],
  today: string,
  numWeeks = 12,
): DayCell[][] {
  const thisWeek = weekStart(today);
  const cols: DayCell[][] = [];
  for (let w = numWeeks - 1; w >= 0; w--) {
    const start = addDays(thisWeek, -7 * w);
    const col: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, d);
      col.push(date > today ? { date, state: "future" } : dayState(goals, completions, date));
    }
    cols.push(col);
  }
  return cols;
}

export function reviewDue(lastReviewDate: string | undefined, oldestGoal: string | undefined, today: string): boolean {
  if (!oldestGoal) return false;
  if (daysBetween(oldestGoal, today) < 6) return false;
  if (!lastReviewDate) return true;
  return daysBetween(lastReviewDate, today) >= 6;
}
