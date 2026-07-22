// Deterministic demo dataset: a 24-day-old health goal with realistic
// ~75% adherence, one rough patch, one completed weekly review, and a
// partially-done today — so every screen has something true to show.

import type { Completion, Goal, WeeklyReview } from "./types";
import { addDays, fromKey, todayKey } from "./dates";

export function buildDemoData(): {
  goals: Goal[];
  completions: Completion[];
  reviews: WeeklyReview[];
} {
  const today = todayKey();
  const start = addDays(today, -23);

  const habits = [
    { id: "demo_walk", title: "Walk for 20 minutes", why: "Movement is the highest-leverage health habit — it improves energy, sleep, and mood in one action.", cadence: { type: "daily" as const }, timeHint: "morning" as const, status: "active" as const, time: "07:30" },
    { id: "demo_water", title: "Drink water before anything else", why: "Starting hydrated sharpens focus and cuts the afternoon crash.", cadence: { type: "daily" as const }, timeHint: "morning" as const, status: "active" as const },
    { id: "demo_strength", title: "Strength session", why: "Muscle is the engine of metabolism and long-term health. Three short sessions beat one heroic one.", cadence: { type: "weekly" as const, times: 3 }, timeHint: "afternoon" as const, status: "active" as const },
    // Eased from daily to 5x/week by the demo weekly review below.
    { id: "demo_sleep", title: "Begin winding down by 10:30", why: "Sleep multiplies every other habit. Protecting the last hour is how you protect the next day.", cadence: { type: "weekly" as const, times: 5 }, timeHint: "evening" as const, status: "active" as const, time: "22:30" },
  ];

  const goal: Goal = {
    id: "demo_goal",
    input: "I want to become healthier",
    title: "Build real, lasting energy",
    identity: "someone who takes care of their body",
    category: "health",
    purpose: "So I have the energy to be fully present with my kids after work.",
    purposeAI: false,
    habits,
    milestones: [
      { id: "demo_ms1", title: "Complete your first full week", week: 1, done: true },
      { id: "demo_ms2", title: "Hit every strength session in a single week", week: 2, done: true },
      { id: "demo_ms3", title: "Two weeks of consistent wind-downs", week: 3, done: false },
      { id: "demo_ms4", title: "A full month of showing up for your body", week: 4, done: false },
    ],
    status: "active",
    createdAt: start,
  };

  const completions: Completion[] = [];
  // Fixed skip pattern (~75% adherence) with a two-day rough patch at days 14-15.
  const skipDays = new Set([5, 14, 15, 20]);
  const lightDays = new Set([3, 9, 18, 22]); // only one habit done
  for (let day = 0; day < 23; day++) {
    const date = addDays(start, day);
    if (skipDays.has(day)) continue;
    if (lightDays.has(day)) {
      completions.push({ habitId: "demo_walk", date });
      continue;
    }
    completions.push({ habitId: "demo_walk", date });
    completions.push({ habitId: "demo_water", date });
    if (day % 3 !== 2) completions.push({ habitId: "demo_sleep", date });
    const dow = fromKey(date).getDay();
    if (dow === 1 || dow === 3 || dow === 5) {
      completions.push({ habitId: "demo_strength", date });
    }
  }
  // Today: one thing done so the dashboard is mid-flight, not finished.
  completions.push({ habitId: "demo_water", date: today });

  const review: WeeklyReview = {
    id: "demo_review",
    date: addDays(today, -6),
    worked: ["Walk for 20 minutes", "Drink water before anything else"],
    hard: ["Begin winding down by 10:30"],
    note: "Evenings get away from me when work runs late.",
    prioritiesChanged: false,
    summary:
      '"Walk for 20 minutes" and "Drink water before anything else" felt good this week — that\'s your foundation, and it stays untouched. I\'ve eased the habits that felt hard. A habit you keep at 70% size beats one you quit at 100%.',
    changes: ['"Begin winding down by 10:30" is now 5× a week instead of daily — two built-in off days, zero guilt.'],
  };

  return { goals: [goal], completions, reviews: [review] };
}
