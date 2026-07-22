import { useState } from "react";
import { ArrowRight, Check, MessageSquareHeart, Sparkles } from "lucide-react";
import type { WeeklyReview } from "../lib/types";
import { useStore, uid } from "../lib/store";
import { activeGoals, reviewDue } from "../lib/selectors";
import { formatShort, lastNDays, todayKey } from "../lib/dates";
import { easeHabit, reviewSummary } from "../lib/ai/engine";
import { Button, Card, Chip, EmptyState, SectionLabel } from "../components/ui";

type Step = "intro" | "worked" | "hard" | "note" | "summary";

export default function Review() {
  const goals = useStore((s) => s.goals);
  const reviews = useStore((s) => s.reviews);
  const tone = useStore((s) => s.tone);
  const updateHabit = useStore((s) => s.updateHabit);
  const addReview = useStore((s) => s.addReview);

  const [step, setStep] = useState<Step>("intro");
  const [worked, setWorked] = useState<string[]>([]);
  const [hard, setHard] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [prioritiesChanged, setPrioritiesChanged] = useState(false);
  const [result, setResult] = useState<WeeklyReview | null>(null);

  const active = activeGoals(goals);
  const habits = active.flatMap((g) =>
    g.habits.filter((h) => h.status === "active").map((h) => ({ goal: g, habit: h })),
  );
  const today = todayKey();
  const oldest = active.length
    ? active.reduce((min, g) => (g.createdAt < min ? g.createdAt : min), today)
    : undefined;
  const due = reviewDue(reviews[0]?.date, oldest, today);

  if (active.length === 0) {
    return (
      <Shell>
        <EmptyState
          icon={<MessageSquareHeart size={28} />}
          title="Reviews unlock once you have a plan"
          body="After your first week, the AI checks in: what worked, what was heavy, and how the plan should bend to fit your real life."
        />
      </Shell>
    );
  }

  function toggle(list: string[], setList: (v: string[]) => void, title: string) {
    setList(list.includes(title) ? list.filter((t) => t !== title) : [...list, title]);
  }

  function finish() {
    // Apply cadence eases to habits marked hard; collect descriptions.
    const changes: string[] = [];
    for (const { goal, habit } of habits) {
      if (!hard.includes(habit.title)) continue;
      const eased = easeHabit(habit.title, habit.cadence);
      if (eased) {
        updateHabit(goal.id, habit.id, { cadence: eased.newCadence });
        changes.push(eased.description);
      }
    }
    const review: WeeklyReview = {
      id: uid("review"),
      date: today,
      worked,
      hard,
      note: note.trim(),
      prioritiesChanged,
      summary: reviewSummary(tone, worked, hard, changes),
      changes,
    };
    addReview(review);
    setResult(review);
    setStep("summary");
  }

  return (
    <Shell>
      {step === "intro" && (
        <div className="animate-rise">
          <Card tone={due ? "accent" : "default"}>
            <h2 className="text-lg font-semibold">
              {due ? "Your weekly review is ready" : "Check in whenever you like"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Three quick questions. Your answers reshape next week's plan — habits that felt
              heavy get lighter, habits that worked get protected. This is how the plan stays
              honest about your real life.
            </p>
            <div className="mt-5">
              <Button variant="primary" onClick={() => setStep("worked")}>
                Start review <ArrowRight size={16} />
              </Button>
            </div>
          </Card>
          <PastReviews reviews={reviews} />
        </div>
      )}

      {step === "worked" && (
        <QuestionStep
          title="What felt good this week?"
          subtitle="Tap the habits that felt natural — even once counts."
          onNext={() => setStep("hard")}
          nextLabel="Next"
        >
          <ChipGrid
            options={habits.map((x) => x.habit.title)}
            selected={worked}
            onToggle={(t) => toggle(worked, setWorked, t)}
          />
        </QuestionStep>
      )}

      {step === "hard" && (
        <QuestionStep
          title="What felt heavy?"
          subtitle="Anything you tap here gets made smaller — that's the point of asking."
          onNext={() => setStep("note")}
          nextLabel="Next"
        >
          <ChipGrid
            options={habits.map((x) => x.habit.title)}
            selected={hard}
            onToggle={(t) => toggle(hard, setHard, t)}
          />
        </QuestionStep>
      )}

      {step === "note" && (
        <QuestionStep
          title="Anything else the plan should know?"
          subtitle="Life changes — the plan should too."
          onNext={finish}
          nextLabel="Finish review"
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Work got busy… I'm traveling next week… (optional)"
            aria-label="Additional notes"
            className="w-full resize-none rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-zinc-400 focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-600"
          />
          <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={prioritiesChanged}
              onChange={(e) => setPrioritiesChanged(e.target.checked)}
              className="h-4 w-4 accent-amber-400"
            />
            My priorities have shifted this week
          </label>
          {prioritiesChanged && (
            <p className="mt-2 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
              Worth a visit to the Goals page after this — pausing a goal that no longer fits is
              a feature, not a failure.
            </p>
          )}
          <WeekJournal today={today} />
        </QuestionStep>
      )}

      {step === "summary" && result && (
        <div className="animate-rise">
          <Card tone="accent">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Sparkles size={16} />
              <SectionLabel>Coach's summary</SectionLabel>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed">{result.summary}</p>
            {result.changes.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-amber-400/20 pt-4">
                {result.changes.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <Check size={14} className="mt-0.5 shrink-0 text-amber-500" />
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <div className="mt-6">
            <Button
              variant="soft"
              onClick={() => {
                setStep("intro");
                setWorked([]);
                setHard([]);
                setNote("");
                setPrioritiesChanged(false);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Weekly review
      </h1>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function QuestionStep({
  title,
  subtitle,
  children,
  onNext,
  nextLabel,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onNext: () => void;
  nextLabel: string;
}) {
  return (
    <div className="animate-rise">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      <div className="mt-6">{children}</div>
      <div className="mt-8">
        <Button variant="primary" onClick={onNext}>
          {nextLabel} <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}

function ChipGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (title: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((title) => (
        <Chip key={title} active={selected.includes(title)} onClick={() => onToggle(title)}>
          {title}
        </Chip>
      ))}
    </div>
  );
}

function WeekJournal({ today }: { today: string }) {
  const journal = useStore((s) => s.journal);
  const lines = lastNDays(7, today)
    .filter((date) => journal[date])
    .map((date) => ({ date, text: journal[date] }));
  if (lines.length === 0) return null;
  return (
    <div className="mt-8">
      <SectionLabel>Your week, in your words</SectionLabel>
      <ul className="mt-3 space-y-2">
        {lines.map(({ date, text }) => (
          <li key={date} className="flex gap-3 text-sm leading-relaxed">
            <span className="w-14 shrink-0 text-xs font-medium text-zinc-400 dark:text-zinc-500">
              {formatShort(date)}
            </span>
            <span className="text-zinc-600 italic dark:text-zinc-300">“{text}”</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PastReviews({ reviews }: { reviews: WeeklyReview[] }) {
  if (reviews.length === 0) return null;
  return (
    <div className="mt-10">
      <SectionLabel>Past reviews</SectionLabel>
      <div className="mt-3 space-y-3">
        {reviews.map((r) => (
          <Card key={r.id}>
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
              {formatShort(r.date)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {r.summary}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
