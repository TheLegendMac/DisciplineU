import { useMemo, useState } from "react";
import { ArrowRight, Check, Plus } from "lucide-react";
import type { Category, HabitDraft, PlanDraft } from "../lib/types";
import { rankedPracticeOptions, type PracticeOption } from "../lib/ai/engine";
import { Button } from "./ui";

const MIN_PICKS = 2;
const MAX_PICKS = 4;
const INITIAL_VISIBLE = 10;
const REVEAL_STEP = 10;

// Bubble palette. Color encodes life area: warm reds and oranges for the
// body, yellows for mind and focus, greens for calm, blue for connection.
const AREAS: Record<Category, { label: string; idle: string; active: string }> = {
  health: {
    label: "Body & health",
    idle: "bg-orange-400/20 text-orange-800 dark:bg-orange-400/15 dark:text-orange-200",
    active: "bg-orange-400 text-orange-950",
  },
  fitness: {
    label: "Body & health",
    idle: "bg-red-400/20 text-red-800 dark:bg-red-400/15 dark:text-red-200",
    active: "bg-red-400 text-red-950",
  },
  career: {
    label: "Career & work",
    idle: "bg-yellow-400/20 text-yellow-800 dark:bg-yellow-400/15 dark:text-yellow-200",
    active: "bg-yellow-400 text-yellow-950",
  },
  learning: {
    label: "Mind & learning",
    idle: "bg-lime-400/20 text-lime-800 dark:bg-lime-400/15 dark:text-lime-200",
    active: "bg-lime-400 text-lime-950",
  },
  productivity: {
    label: "Focus & follow-through",
    idle: "bg-amber-400/20 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
    active: "bg-amber-400 text-amber-950",
  },
  finance: {
    label: "Money",
    idle: "bg-teal-400/20 text-teal-800 dark:bg-teal-400/15 dark:text-teal-200",
    active: "bg-teal-400 text-teal-950",
  },
  social: {
    label: "Social & connection",
    idle: "bg-sky-400/20 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200",
    active: "bg-sky-400 text-sky-950",
  },
  creativity: {
    label: "Creativity",
    idle: "bg-violet-400/20 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200",
    active: "bg-violet-400 text-violet-950",
  },
  mindfulness: {
    label: "Calm & recovery",
    idle: "bg-green-400/20 text-green-800 dark:bg-green-400/15 dark:text-green-200",
    active: "bg-green-400 text-green-950",
  },
  general: {
    label: "Your goal, directly",
    idle: "bg-zinc-400/20 text-zinc-700 dark:bg-zinc-400/15 dark:text-zinc-200",
    active: "bg-zinc-300 text-zinc-950",
  },
};

function cadenceLabel(h: HabitDraft): string {
  const base = h.cadence.type === "daily" ? "Daily" : `${h.cadence.times}× a week`;
  return h.timeHint === "anytime" ? base : `${base} · ${h.timeHint}`;
}

export default function PracticePicker({
  draft,
  onContinue,
  onBack,
}: {
  draft: PlanDraft;
  onContinue: (habits: HabitDraft[]) => void;
  onBack: () => void;
}) {
  // The AI's picks lead and stay selected; the rest of the pool is ranked by
  // how closely it matches what the user actually wrote, best-first.
  const options = useMemo(() => {
    const pinnedTitles = new Set(draft.habits.map((h) => h.title));
    const pinned: PracticeOption[] = draft.habits.map((habit) => ({ habit, category: draft.category }));
    const rest = rankedPracticeOptions(draft.input, draft.category).filter(
      (o) => !pinnedTitles.has(o.habit.title),
    );
    return [...pinned, ...rest];
  }, [draft]);

  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(draft.habits.map((h) => h.title)),
  );
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [focused, setFocused] = useState<PracticeOption | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function toggle(option: PracticeOption) {
    const title = option.habit.title;
    const next = new Set(picked);
    if (next.has(title)) {
      next.delete(title);
      if (focused?.habit.title === title) setFocused(null);
    } else {
      if (next.size >= MAX_PICKS) {
        setNotice("Four is plenty — a small plan you keep beats a full one you don't. Deselect one to swap.");
        return;
      }
      next.add(title);
      setFocused(option);
    }
    setPicked(next);
    setNotice(null);
  }

  const shown = options.slice(0, visibleCount);
  const remaining = options.length - visibleCount;

  return (
    <div className="animate-rise mx-auto w-full max-w-xl pb-12 md:max-w-3xl">
      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
        For “{draft.title}”
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Choose what you'll practice
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        You're becoming{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-200">{draft.identity}</span>. The
        bright bubbles are the AI's picks for what you wrote — tap any bubble to add it and see why
        it works. Two to four practices, kept, is the sweet spot.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        {shown.map((option, i) => (
          <Bubble
            key={option.habit.title}
            option={option}
            picked={picked.has(option.habit.title)}
            delayMs={Math.min(i, INITIAL_VISIBLE) * 22}
            onToggle={() => toggle(option)}
          />
        ))}
      </div>

      {remaining > 0 && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="soft"
            size="sm"
            onClick={() => setVisibleCount((c) => Math.min(c + REVEAL_STEP, options.length))}
          >
            <Plus size={14} /> More options ({remaining} more)
          </Button>
        </div>
      )}

      <div className="sticky bottom-20 z-30 mx-auto mt-8 max-w-xl rounded-2xl border border-zinc-200 bg-white/95 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 md:bottom-4">
        {notice ? (
          <p className="text-sm leading-relaxed text-amber-600 dark:text-amber-400">{notice}</p>
        ) : focused ? (
          <div>
            <p className="text-sm font-semibold">
              {focused.habit.title}
              <span className="ml-2 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                {AREAS[focused.category].label} · {cadenceLabel(focused.habit)}
              </span>
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {focused.habit.why}
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Tap a practice to add it — and to see why it works.
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              Back
            </Button>
            <span className="text-xs font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
              {picked.size} of {MAX_PICKS} picked
              {picked.size < MIN_PICKS && " · pick at least 2"}
            </span>
          </div>
          <Button
            variant="primary"
            size="lg"
            disabled={picked.size < MIN_PICKS}
            onClick={() =>
              onContinue(options.filter((o) => picked.has(o.habit.title)).map((o) => o.habit))
            }
          >
            Continue <ArrowRight size={17} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  option,
  picked,
  delayMs,
  onToggle,
}: {
  option: PracticeOption;
  picked: boolean;
  delayMs: number;
  onToggle: () => void;
}) {
  const area = AREAS[option.category];
  return (
    <button
      type="button"
      aria-pressed={picked}
      aria-label={`${option.habit.title} — ${area.label}, ${cadenceLabel(option.habit)}`}
      onClick={onToggle}
      style={{ animationDelay: `${delayMs}ms` }}
      className={`bubble animate-bubble-in flex max-w-[15rem] touch-manipulation items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-medium leading-snug transition-[background-color,color,box-shadow] duration-200 select-none active:scale-95 ${
        picked ? `${area.active} shadow-md` : `${area.idle} hover:brightness-[1.08]`
      }`}
    >
      {picked && <Check size={14} aria-hidden className="shrink-0 opacity-80" />}
      <span>{option.habit.title}</span>
    </button>
  );
}
