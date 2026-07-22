import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronUp, Plus } from "lucide-react";
import type { Category, HabitDraft, PlanDraft } from "../lib/types";
import { practiceOptions, type PracticeOption } from "../lib/ai/engine";
import { Button, SectionLabel } from "./ui";

const MIN_PICKS = 2;
const MAX_PICKS = 4;

// Bubble palette. Color encodes life area: warm reds and oranges for the
// body, yellows for mind and focus, greens for calm, blue for connection.
const AREAS: Record<Category, { label: string; idle: string; active: string }> = {
  health: {
    label: "Body & health",
    idle: "bg-orange-400/20 text-orange-800 dark:bg-orange-400/15 dark:text-orange-300",
    active: "bg-orange-400 text-orange-950",
  },
  fitness: {
    label: "Body & health",
    idle: "bg-red-400/20 text-red-800 dark:bg-red-400/15 dark:text-red-300",
    active: "bg-red-400 text-red-950",
  },
  career: {
    label: "Career & work",
    idle: "bg-yellow-400/20 text-yellow-800 dark:bg-yellow-400/15 dark:text-yellow-300",
    active: "bg-yellow-400 text-yellow-950",
  },
  learning: {
    label: "Mind & learning",
    idle: "bg-lime-400/20 text-lime-800 dark:bg-lime-400/15 dark:text-lime-300",
    active: "bg-lime-400 text-lime-950",
  },
  productivity: {
    label: "Focus & follow-through",
    idle: "bg-amber-400/20 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
    active: "bg-amber-400 text-amber-950",
  },
  finance: {
    label: "Money",
    idle: "bg-teal-400/20 text-teal-800 dark:bg-teal-400/15 dark:text-teal-300",
    active: "bg-teal-400 text-teal-950",
  },
  social: {
    label: "Social & connection",
    idle: "bg-sky-400/20 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300",
    active: "bg-sky-400 text-sky-950",
  },
  creativity: {
    label: "Creativity",
    idle: "bg-violet-400/20 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300",
    active: "bg-violet-400 text-violet-950",
  },
  mindfulness: {
    label: "Calm & recovery",
    idle: "bg-green-400/20 text-green-800 dark:bg-green-400/15 dark:text-green-300",
    active: "bg-green-400 text-green-950",
  },
  general: {
    label: "Your goal, directly",
    idle: "bg-zinc-400/20 text-zinc-700 dark:bg-zinc-400/15 dark:text-zinc-300",
    active: "bg-zinc-300 text-zinc-950",
  },
};

function cadenceLabel(h: HabitDraft): string {
  const base = h.cadence.type === "daily" ? "Daily" : `${h.cadence.times}× a week`;
  return h.timeHint === "anytime" ? base : `${base} · ${h.timeHint}`;
}

// Alternating row sizes nest the circles into a honeycomb; the wide pair
// is used from md: up, where the grid spans the full content width.
function honeycombRows(options: PracticeOption[], sizes: [number, number]): PracticeOption[][] {
  const rows: PracticeOption[][] = [];
  let i = 0;
  let alt = 0;
  while (i < options.length) {
    rows.push(options.slice(i, i + sizes[alt]));
    i += sizes[alt];
    alt = 1 - alt;
  }
  return rows;
}

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
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
  const options = useMemo(() => {
    const pool = practiceOptions(draft.category);
    // Regeneration can produce habits not in the pool; keep them visible.
    const missing = draft.habits
      .filter((h) => !pool.some((o) => o.habit.title === h.title))
      .map((habit) => ({ habit, category: draft.category }));
    return [...missing, ...pool];
  }, [draft]);

  const goalOptions = options.filter((o) => o.category === draft.category);
  const otherOptions = options.filter((o) => o.category !== draft.category);

  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(draft.habits.map((h) => h.title)),
  );
  // If a previous pass picked something outside the goal area (e.g. coming
  // Back from the plan), that section must start open or the pick is hidden.
  const [showOthers, setShowOthers] = useState(() =>
    draft.habits.some((h) => otherOptions.some((o) => o.habit.title === h.title)),
  );
  const [focused, setFocused] = useState<PracticeOption | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isDesktop = useIsDesktop();

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

  const goalRows = honeycombRows(goalOptions, isDesktop ? [5, 4] : [3, 2]);
  const otherRows = honeycombRows(otherOptions, isDesktop ? [6, 5] : [3, 2]);

  return (
    <div className="animate-rise mx-auto w-full max-w-xl pb-12 md:max-w-4xl">
      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
        For “{draft.title}”
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Choose what you'll practice
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        You're becoming{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-200">{draft.identity}</span>.
        The bright bubbles are the AI's picks — hover or tap any bubble to see why it works.
        Two to four practices, kept, is the sweet spot.
      </p>

      <div className="mt-8">
        <SectionLabel>Built for your goal</SectionLabel>
        <div className="bubble-grid mt-4 flex flex-col items-center">
          {goalRows.map((row, ri) => (
            <div
              key={ri}
              className={`bubble-row flex justify-center gap-2 sm:gap-2.5 ${ri > 0 ? "-mt-2.5 sm:-mt-3" : ""}`}
            >
              {row.map((option, ci) => (
                <Bubble
                  key={option.habit.title}
                  option={option}
                  picked={picked.has(option.habit.title)}
                  size="lg"
                  delayMs={(ri * 5 + ci) * 25}
                  onToggle={() => toggle(option)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {showOthers ? (
          <>
            <div className="flex items-center justify-between">
              <SectionLabel>Borrow from other areas</SectionLabel>
              <button
                type="button"
                onClick={() => setShowOthers(false)}
                className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <ChevronUp size={13} /> Hide
              </button>
            </div>
            <div className="bubble-grid mt-4 flex flex-col items-center">
              {otherRows.map((row, ri) => (
                <div
                  key={ri}
                  className={`bubble-row flex justify-center gap-2 ${ri > 0 ? "-mt-2" : ""}`}
                >
                  {row.map((option, ci) => (
                    <Bubble
                      key={option.habit.title}
                      option={option}
                      picked={picked.has(option.habit.title)}
                      size="sm"
                      delayMs={(ri * 6 + ci) * 18}
                      onToggle={() => toggle(option)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex justify-center">
            <Button variant="soft" size="sm" onClick={() => setShowOthers(true)} aria-expanded={false}>
              <Plus size={14} /> Explore other life areas ({otherOptions.length})
            </Button>
          </div>
        )}
      </div>

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
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
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
  size,
  delayMs,
  onToggle,
}: {
  option: PracticeOption;
  picked: boolean;
  size: "lg" | "sm";
  delayMs: number;
  onToggle: () => void;
}) {
  const area = AREAS[option.category];
  const sizeCls =
    size === "lg"
      ? "w-[min(6.6rem,27vw)] text-[11px] sm:w-32 sm:text-xs md:w-36"
      : "w-[min(5.8rem,24vw)] text-[10px] sm:w-24";
  const whyCls = size === "lg" ? "text-[10px] sm:text-[11px]" : "text-[9px]";
  return (
    <button
      type="button"
      aria-pressed={picked}
      aria-label={`${option.habit.title} — ${area.label}, ${cadenceLabel(option.habit)}`}
      onClick={onToggle}
      style={{ animationDelay: `${delayMs}ms` }}
      className={`bubble animate-bubble-in group/bubble relative flex aspect-square shrink-0 touch-manipulation items-center justify-center rounded-full text-center font-medium leading-tight transition-all duration-200 select-none active:z-20 active:scale-110 ${sizeCls} ${
        picked ? `${area.active} z-10 scale-105 shadow-lg` : area.idle
      }`}
    >
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-2.5 transition-opacity duration-150 group-hover/bubble:opacity-0 group-active/bubble:opacity-0">
        {picked && <Check size={13} aria-hidden className="opacity-70" />}
        <span>{option.habit.title}</span>
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center px-3.5 opacity-0 transition-opacity duration-150 group-hover/bubble:opacity-100 group-active/bubble:opacity-100"
      >
        <span className={`line-clamp-5 leading-snug ${whyCls}`}>{option.habit.why}</span>
      </span>
    </button>
  );
}
