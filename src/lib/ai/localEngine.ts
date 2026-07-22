// Deterministic plan engine. Ships as V1's "AI" so the product works
// offline, instantly, and at zero marginal cost. It implements the same
// contract the production Claude provider will (see claudeProvider.ts):
// goal text in → structured PlanDraft out. Swapping engines is a one-line
// change in engine.ts.

import type { Cadence, Category, HabitDraft, PlanDraft, TimeHint, Tone } from "../types";
import { checkInput } from "./guardrails";

interface CategoryTemplate {
  keywords: RegExp;
  title: string;
  identity: string; // "someone who ..."
  purpose: string;
  habits: HabitDraft[];
  alternates: HabitDraft[];
  milestones: string[];
}

const h = (
  title: string,
  why: string,
  cadence: Cadence,
  timeHint: TimeHint = "anytime",
): HabitDraft => ({ title, why, cadence, timeHint });

const daily: Cadence = { type: "daily" };
const weekly = (times: number): Cadence => ({ type: "weekly", times });

const TEMPLATES: Record<Category, CategoryTemplate> = {
  health: {
    keywords: /health|energy|sleep|tired|water|eat better|nutrition|feel better|wellness/i,
    title: "Build real, lasting energy",
    identity: "someone who takes care of their body",
    purpose: "So I have genuine energy for the people and work I care about.",
    habits: [
      h("Walk for 20 minutes", "Movement is the highest-leverage health habit — it improves energy, sleep, and mood in one action.", daily, "morning"),
      h("Drink water before anything else", "Starting hydrated sharpens focus and cuts the afternoon crash.", daily, "morning"),
      h("Strength session", "Muscle is the engine of metabolism and long-term health. Three short sessions beat one heroic one.", weekly(3), "afternoon"),
      h("Begin winding down by 10:30", "Sleep multiplies every other habit. Protecting the last hour is how you protect the next day.", daily, "evening"),
    ],
    alternates: [
      h("Stretch for 10 minutes", "Mobility keeps movement comfortable, which keeps movement happening.", daily, "evening"),
      h("Cook one real meal", "One home-cooked meal a day quietly fixes most of a diet.", daily, "evening"),
      h("Get sunlight within an hour of waking", "Morning light anchors your body clock — better sleep starts in the morning.", daily, "morning"),
      h("No screens in bed", "The bed stays a sleep cue, so falling asleep gets easier every night.", daily, "evening"),
    ],
    milestones: [
      "Complete your first full week",
      "Hit every strength session in a single week",
      "Two weeks of consistent wind-downs",
      "A full month of showing up for your body",
    ],
  },
  fitness: {
    keywords: /fit|gym|exercise|work ?out|run|running|stronger|muscle|weight|lose \d+|pounds|kilos|marathon|shape/i,
    title: "Get strong and consistent",
    identity: "someone who trains, rain or shine",
    purpose: "So I feel strong and capable in my own body.",
    habits: [
      h("Train for 30 minutes", "Consistency beats intensity. A repeatable 30 minutes builds more than an occasional two hours.", weekly(3), "afternoon"),
      h("Walk after one meal", "A short post-meal walk aids digestion, steadies energy, and adds up fast.", daily, "evening"),
      h("Protein with breakfast", "Protein early keeps you full and gives training something to build with.", daily, "morning"),
      h("Lay out tomorrow's workout gear", "Removing one small friction doubles the odds you actually go.", daily, "evening"),
    ],
    alternates: [
      h("10 minutes of mobility work", "Staying loose prevents the injuries that break momentum.", weekly(3), "evening"),
      h("Track one metric (not weight)", "Reps, distance, or energy — progress you can see fuels progress you can't yet.", weekly(2)),
      h("Prep tomorrow's lunch", "Decisions made in advance are decisions made well.", daily, "evening"),
    ],
    milestones: [
      "Complete your first full training week",
      "Two weeks without missing a session",
      "Notice one thing that got easier",
      "One month of training — you're a person who trains now",
    ],
  },
  career: {
    keywords: /career|job|promotion|business|startup|professional|interview|resume|freelance|salary|network/i,
    title: "Move your career forward deliberately",
    identity: "someone who builds their career on purpose",
    purpose: "So my work compounds toward a future I chose, not one I drifted into.",
    habits: [
      h("One deep-work block on your top priority", "45 undistracted minutes a day outperforms scattered hours. This is where careers actually move.", daily, "morning"),
      h("Ship something visible", "Finished, visible work is what careers are judged on. Small and shipped beats big and pending.", weekly(1)),
      h("Reach out to one person in your field", "Opportunities travel through people. One genuine message a week compounds into a network.", weekly(2)),
      h("Write tomorrow's most important task", "Ending the day with a decision means starting the next one with momentum.", daily, "evening"),
    ],
    alternates: [
      h("Learn your craft for 20 minutes", "Skills are the only career asset nobody can take away.", daily, "evening"),
      h("Ask one person for feedback", "Feedback is the fastest loop between where you are and where you're going.", weekly(1)),
      h("Update your portfolio or profile", "Keep the door open before you need to walk through it.", weekly(1)),
    ],
    milestones: [
      "Five deep-work blocks completed",
      "First piece of work shipped",
      "Two real conversations with people in your field",
      "A month of deliberate career-building",
    ],
  },
  learning: {
    keywords: /learn|study|language|course|read|reading|book|skill|code|coding|program|spanish|french|math|degree|exam/i,
    title: "Learn deliberately, every day",
    identity: "someone who is always getting sharper",
    purpose: "So I keep growing instead of plateauing.",
    habits: [
      h("25 focused minutes of study", "A daily focused block beats weekend cramming — memory is built by frequency, not volume.", daily, "morning"),
      h("Quiz yourself on what you learned", "Active recall is the single most effective study technique known. Retrieval is what makes it stick.", weekly(3), "evening"),
      h("Explain one idea in your own words", "If you can teach it, you know it. Writing or saying it out loud exposes the gaps.", weekly(1)),
    ],
    alternates: [
      h("Read 10 pages", "Ten pages a day is fifteen books a year.", daily, "evening"),
      h("Practice with a real project", "Applied beats theoretical — build something small with what you know.", weekly(2)),
      h("Review your notes for 5 minutes", "A short review the next day doubles retention for almost no cost.", daily, "evening"),
    ],
    milestones: [
      "First full week of daily study",
      "Explain a concept without checking notes",
      "Finish your first unit, chapter, or project",
      "A month of compounding knowledge",
    ],
  },
  productivity: {
    keywords: /productiv|procrastinat|focus|disciplin|organized|organised|lazy|time|distract|phone|scroll|routine|consistent/i,
    title: "Build consistent follow-through",
    identity: "someone who does what they said they would",
    purpose: "So my days reflect my intentions, not my impulses.",
    habits: [
      h("Plan tomorrow in 5 minutes", "A day planned the night before starts itself. This is the keystone habit for everything else.", daily, "evening"),
      h("Do the most important task before noon", "One meaningful thing done early makes the whole day a win, whatever happens after.", daily, "morning"),
      h("One 45-minute phone-free block", "Attention is the raw material of everything you want to build. Protect one block of it.", daily, "afternoon"),
      h("Weekly reset: clear desk and inboxes", "A clean slate every week stops small chaos from becoming big chaos.", weekly(1)),
    ],
    alternates: [
      h("Two-minute rule: do small things now", "Anything under two minutes, done immediately, never becomes a pile.", daily),
      h("Shut down work with a written stop", "An explicit end to the workday protects the evening — and tomorrow's energy.", daily, "evening"),
      h("Time-block your morning", "Deciding when beats deciding whether.", daily, "morning"),
    ],
    milestones: [
      "Five planned days in a row",
      "A full week of most-important-tasks done",
      "Two weeks of protected focus blocks",
      "A month of keeping promises to yourself",
    ],
  },
  finance: {
    keywords: /money|save|saving|debt|finance|financial|budget|invest|spend|broke|paycheck|rich|wealth/i,
    title: "Take calm control of your money",
    identity: "someone whose money has a plan",
    purpose: "So money becomes a tool I direct instead of a stress I carry.",
    habits: [
      h("Log today's spending (2 minutes)", "Awareness precedes control. You can't steer what you don't see — and seeing takes two minutes.", daily, "evening"),
      h("Move something to savings", "Paying yourself first, automatically, is how ordinary incomes build real savings.", weekly(1)),
      h("One no-spend day", "A day without spending resets the default from 'buy it' to 'do I want it?'", weekly(2)),
      h("15-minute money review", "A short weekly look at in-versus-out replaces vague money anxiety with actual information.", weekly(1)),
    ],
    alternates: [
      h("Bring lunch instead of buying", "The most reliable savings are the ones built into routine.", weekly(3), "morning"),
      h("Learn one money concept for 15 minutes", "Financial literacy pays compound interest forever.", weekly(2), "evening"),
      h("Review one subscription", "Recurring costs are decisions you made once and pay for monthly. Re-decide them.", weekly(1)),
    ],
    milestones: [
      "One full week of tracked spending",
      "First deliberate transfer to savings",
      "Two money reviews completed",
      "A month of money moving on purpose",
    ],
  },
  social: {
    keywords: /confiden|social|friend|shy|awkward|talk|people|dating|date|relationship|lonely|alone|meet|conversation|introvert/i,
    title: "Grow real social confidence",
    identity: "someone who connects easily",
    purpose: "So connection feels natural instead of exhausting.",
    habits: [
      h("Start one genuine conversation", "Confidence isn't a trait, it's a rep count. One real exchange a day rewires what feels normal.", daily),
      h("Say yes to one social thing", "Showing up is 80% of connection. One event a week keeps the muscle warm.", weekly(1)),
      h("Practice your 30-second introduction", "Knowing how you'll open removes the scariest moment. Rehearsed once, available always.", weekly(3), "morning"),
      h("Note one social win", "Your brain remembers the awkward moments for free. Recording the wins balances the books.", daily, "evening"),
    ],
    alternates: [
      h("Give one genuine compliment", "Warmth given comes back. It's also the easiest conversation opener there is.", daily),
      h("Ask one follow-up question", "People remember how you listened, not what you said. Follow-ups are listening made visible.", daily),
      h("Invite someone for coffee or a walk", "Friendships form from small, repeated invitations. Be the one who asks.", weekly(1)),
    ],
    milestones: [
      "Seven conversations started",
      "First event attended",
      "Introduce yourself without rehearsing",
      "A month of showing up for connection",
    ],
  },
  creativity: {
    keywords: /creativ|write|writing|writer|art|draw|paint|music|song|novel|poetry|content|youtube|film|photo|design|craft/i,
    title: "Make creating a daily practice",
    identity: "someone who makes things",
    purpose: "So the ideas in my head exist in the world.",
    habits: [
      h("Create for 20 minutes before consuming", "Creating before scrolling means your best attention goes to your own work, not everyone else's.", daily, "morning"),
      h("Finish and share one small piece", "Finished work teaches what unfinished work can't. Small and shared beats perfect and private.", weekly(1)),
      h("Collect three sparks", "Ideas, photos, overheard lines — creativity runs on inputs. Gather them on purpose.", daily),
    ],
    alternates: [
      h("Study one work you admire", "Analyzing greatness trains the taste that guides your own hands.", weekly(2), "evening"),
      h("Create with a constraint", "Limits force originality. One color, one chord, one hundred words.", weekly(1)),
      h("Revisit and revise one old piece", "Revision is where good work becomes real work.", weekly(1)),
    ],
    milestones: [
      "Seven creation sessions done",
      "First piece finished and shared",
      "Two weeks of creating before consuming",
      "A month of being someone who makes things",
    ],
  },
  mindfulness: {
    keywords: /mindful|calm|stress|overwhelm|present|meditat|peace|balance|gratitude|slow down|burnout|breathe/i,
    title: "Build a calmer, steadier baseline",
    identity: "someone with a steady center",
    purpose: "So I respond to my life instead of just reacting to it.",
    habits: [
      h("Five minutes of quiet breathing", "Five minutes daily changes your baseline more than an hour occasionally. Small and every day is the whole trick.", daily, "morning"),
      h("Journal three lines", "Three honest lines a night turns a blur of days into a life you can actually see.", daily, "evening"),
      h("One hour offline", "An hour without input is where your own thoughts come back.", weekly(2)),
    ],
    alternates: [
      h("Take a walk without your phone", "Movement plus silence is meditation for people who hate sitting still.", weekly(3)),
      h("Write down one thing you're grateful for", "Gratitude redirects a brain built to scan for problems.", daily, "evening"),
      h("Single-task one meal", "Eating as just eating — a daily rehearsal of being where you are.", daily),
    ],
    milestones: [
      "First full week of daily practice",
      "Notice yourself pausing before reacting",
      "Two weeks of journaling",
      "A month of tending your own steadiness",
    ],
  },
  general: {
    keywords: /$^/,
    title: "Become who you decided to be",
    identity: "someone who moves toward their goal every day",
    purpose: "So a year from now, I'm glad I started today.",
    habits: [
      h("20 minutes of direct action on your goal", "Twenty real minutes a day is how big things get built — quietly, daily, without drama.", daily, "morning"),
      h("Write down tomorrow's next step", "A goal with a next step is a plan. A goal without one is a wish.", daily, "evening"),
      h("Weekly progress check-in", "Ten minutes of honest review keeps a month of effort pointed in the right direction.", weekly(1)),
    ],
    alternates: [
      h("Tell someone what you're working toward", "A goal said out loud recruits allies and accountability.", weekly(1)),
      h("Remove one obstacle in advance", "Make the right thing easier tonight than the wrong thing will be tomorrow.", daily, "evening"),
      h("Read or learn 15 minutes in your goal's field", "Knowledge lowers the hill you're climbing.", weekly(3)),
    ],
    milestones: [
      "First full week of daily action",
      "First visible piece of progress",
      "Two weeks of consistency",
      "One month in — momentum is real now",
    ],
  },
};

// Negative self-labels are reframed into constructive goals before
// category matching. The user's words are never echoed back as identity.
const REFRAMES: { pattern: RegExp; category: Category; title: string; identity: string }[] = [
  { pattern: /lazy|unmotivated|no motivation|can.?t (get|do) anything/i, category: "productivity", title: "Build consistent follow-through", identity: "someone who follows through" },
  { pattern: /procrastinat/i, category: "productivity", title: "Start things before they're urgent", identity: "someone who starts" },
  { pattern: /\bfat\b|overweight|hate my body|ugly/i, category: "health", title: "Build strength and energy", identity: "someone who takes care of their body" },
  { pattern: /shy|awkward|no friends|bad at talking|boring/i, category: "social", title: "Grow real social confidence", identity: "someone who connects easily" },
  { pattern: /bad with money|broke|terrible with money/i, category: "finance", title: "Take calm control of your money", identity: "someone whose money has a plan" },
  { pattern: /addicted to (my )?phone|doom.?scroll|screen time|too much (phone|instagram|tiktok)/i, category: "productivity", title: "Reclaim your attention", identity: "someone who owns their attention" },
  { pattern: /messy|disorganized|disorganised|scatterbrained/i, category: "productivity", title: "Build calm, simple systems", identity: "someone with room to think" },
  { pattern: /stupid|dumb|not smart/i, category: "learning", title: "Learn deliberately, every day", identity: "someone who is always getting sharper" },
];

function detectCategory(input: string): Category {
  const entries = Object.entries(TEMPLATES) as [Category, CategoryTemplate][];
  for (const [cat, t] of entries) {
    if (cat !== "general" && t.keywords.test(input)) return cat;
  }
  return "general";
}

function personalize(input: string, fallback: string): string {
  // Preserve the user's own framing when it's already constructive.
  const cleaned = input.trim().replace(/\.+$/, "");
  const m = cleaned.match(/(?:i want to|i'd like to|i wish i could|help me)\s+(.{4,60})/i);
  if (m) {
    const phrase = m[1].trim();
    return phrase.charAt(0).toUpperCase() + phrase.slice(1);
  }
  if (cleaned.length >= 4 && cleaned.length <= 60 && !/\b(i'?m|i am)\b/i.test(cleaned)) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return fallback;
}

export function generatePlan(input: string, seed = 0): PlanDraft {
  const guard = checkInput(input);
  if (guard.level === "crisis") {
    return {
      input,
      title: "",
      identity: "",
      category: "general",
      purpose: "",
      habits: [],
      milestones: [],
      crisis: true,
    };
  }

  const reframe = REFRAMES.find((r) => r.pattern.test(input));
  const category = reframe ? reframe.category : detectCategory(input);
  const t = TEMPLATES[category];

  // Rotate one habit through the alternates pool per regeneration so
  // "Regenerate" visibly changes the plan without losing its shape.
  const habits = [...t.habits];
  if (seed > 0 && t.alternates.length > 0) {
    const swapIndex = seed % habits.length;
    const alt = t.alternates[(seed - 1) % t.alternates.length];
    habits[swapIndex] = alt;
  }

  return {
    input,
    title: reframe ? reframe.title : personalize(input, t.title),
    identity: reframe ? reframe.identity : t.identity,
    category,
    purpose: t.purpose,
    habits: habits.slice(0, 4),
    milestones: t.milestones,
    careNote: guard.level === "sensitive" ? guard.note : undefined,
  };
}

// Candidate pool for the practice picker. The goal's own category
// contributes its full habit + alternate set; every other category
// contributes a taste, so the grid stays browsable rather than exhaustive.
export interface PracticeOption {
  habit: HabitDraft;
  category: Category;
}

export function practiceOptions(primary: Category): PracticeOption[] {
  const order = [primary, ...(Object.keys(TEMPLATES) as Category[]).filter((c) => c !== primary)];
  const seen = new Set<string>();
  const out: PracticeOption[] = [];
  for (const category of order) {
    const t = TEMPLATES[category];
    const pool = category === primary ? [...t.habits, ...t.alternates] : t.habits.slice(0, 3);
    for (const habit of pool) {
      if (seen.has(habit.title)) continue;
      seen.add(habit.title);
      out.push({ habit, category });
    }
  }
  return out;
}

export function alternateHabit(category: Category, excludeTitles: string[]): HabitDraft {
  const t = TEMPLATES[category];
  const pool = [...t.alternates, ...t.habits].filter((x) => !excludeTitles.includes(x.title));
  return pool[0] ?? t.alternates[0] ?? t.habits[0];
}

export function purposeFor(category: Category): string {
  return TEMPLATES[category].purpose;
}

// ---------------------------------------------------------------------------
// Coach voice. Every user-facing coaching string routes through the tone
// dictionary so the tone setting changes the product's voice, not just a label.
// ---------------------------------------------------------------------------

export const TONE_LABELS: Record<Tone, { name: string; sample: string }> = {
  gentle: { name: "Gentle", sample: "Whenever you're ready — one small step is still a step." },
  balanced: { name: "Balanced", sample: "Good day to keep the streak of showing up alive. Start with the easy one." },
  direct: { name: "Direct", sample: "You know what today's priority is. Do it first, then the rest." },
};

export function recoveryCopy(tone: Tone, purpose: string): { title: string; body: string; cta: string } {
  const purposeLine = purpose ? ` You started this for a reason: "${purpose}"` : "";
  switch (tone) {
    case "gentle":
      return {
        title: "Welcome back",
        body: `The last couple of days didn't go to plan — that's part of every real change, not a verdict on you.${purposeLine} Today, let's just do one thing.`,
        cta: "Show me one thing",
      };
    case "direct":
      return {
        title: "Time to get back in",
        body: `Two quiet days. It happens — what matters is the restart speed.${purposeLine} Pick one action and take it now.`,
        cta: "Give me one action",
      };
    default:
      return {
        title: "Let's restart, lightly",
        body: `A couple of days off doesn't undo your progress — stopping the restart would.${purposeLine} One small win today rebuilds the rhythm.`,
        cta: "Start with one thing",
      };
  }
}

export function allDoneCopy(tone: Tone): string {
  switch (tone) {
    case "gentle":
      return "That's everything for today. Rest is part of the plan — enjoy it.";
    case "direct":
      return "Done. That's what follow-through looks like. Same again tomorrow.";
    default:
      return "Everything done. Days like this are how the person you're becoming gets built.";
  }
}

export function progressInsight(tone: Tone, consistency: number | null): string {
  if (consistency === null) {
    return "Once you start checking off actions, your patterns will show up here.";
  }
  if (consistency >= 80) {
    switch (tone) {
      case "gentle": return `You've kept ${consistency}% consistency this week — that's genuinely excellent. Whatever you're doing, it's working.`;
      case "direct": return `${consistency}% this week. Strong. The next edge is protecting this pace on a bad week, not pushing harder on a good one.`;
      default: return `${consistency}% consistency this week — you're in the zone where habits become identity. Protect the routine that's making this possible.`;
    }
  }
  if (consistency >= 50) {
    switch (tone) {
      case "gentle": return `You're at ${consistency}% this week — more than half your actions, done. That's a real foundation. If one habit keeps slipping, we can make it smaller.`;
      case "direct": return `${consistency}% this week. Solid base. Find the one habit you skip most and either shrink it or move it earlier in the day.`;
      default: return `${consistency}% this week — real momentum. Consistency grows fastest when the hardest habit gets easier, not when the easy ones get more frequent.`;
    }
  }
  switch (tone) {
    case "gentle": return `This week's been lighter — ${consistency}%. That usually means the plan is a bit too big for this season of life, not that you're failing. The weekly review can shrink it.`;
    case "direct": return `${consistency}% this week. The plan and your week don't match. Cut it down in the weekly review — a smaller plan you do beats a bigger one you don't.`;
    default: return `You're at ${consistency}% this week. When numbers dip, the answer is almost always a smaller plan, not more willpower. Try easing a habit in your weekly review.`;
  }
}

// ---------------------------------------------------------------------------
// Weekly review adjustment
// ---------------------------------------------------------------------------

export interface Adjustment {
  habitId: string;
  description: string;
  newCadence?: Cadence;
}

export function easeHabit(habitTitle: string, cadence: Cadence): { newCadence: Cadence; description: string } | null {
  if (cadence.type === "daily") {
    return {
      newCadence: weekly(5),
      description: `"${habitTitle}" is now 5× a week instead of daily — two built-in off days, zero guilt.`,
    };
  }
  if (cadence.times > 1) {
    return {
      newCadence: weekly(cadence.times - 1),
      description: `"${habitTitle}" drops to ${cadence.times - 1}× a week — a target you'll actually hit beats one you dread.`,
    };
  }
  return null;
}

export function reviewSummary(tone: Tone, worked: string[], hard: string[], changes: string[]): string {
  const parts: string[] = [];
  if (worked.length > 0) {
    const list = worked.slice(0, 2).map((w) => `"${w}"`).join(" and ");
    parts.push(
      tone === "direct"
        ? `${list} is working — keep it exactly as is.`
        : `${list} felt good this week — that's your foundation, and it stays untouched.`,
    );
  }
  if (hard.length > 0 && changes.length > 0) {
    parts.push(
      tone === "gentle"
        ? `The habits that felt heavy got a little lighter. Shrinking a habit isn't retreat — it's how you keep it alive.`
        : tone === "direct"
          ? `The hard ones got cut down to a size you'll actually do. Hit the smaller target for two weeks, then we scale back up.`
          : `I've eased the habits that felt hard. A habit you keep at 70% size beats one you quit at 100%.`,
    );
  } else if (hard.length > 0) {
    parts.push(`The hard ones are already at their minimum — keep them tiny and protect them.`);
  }
  if (parts.length === 0) {
    parts.push(
      tone === "direct"
        ? "Steady week. No changes — run it back."
        : "A steady week with nothing to fix. The plan fits — keep living it.",
    );
  }
  return parts.join(" ");
}
