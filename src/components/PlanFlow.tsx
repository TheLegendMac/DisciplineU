import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Pencil, RefreshCw, Sparkles, X } from "lucide-react";
import type { PlanDraft } from "../lib/types";
import { CRISIS_RESOURCES, alternateHabit, createPlan, thinkingStages } from "../lib/ai/engine";
import { useStore } from "../lib/store";
import PracticePicker from "./PracticePicker";
import { Button, Card, Chip, SectionLabel, Skeleton } from "./ui";

const EXAMPLES = [
  "I want to become healthier",
  "I want to be more confident socially",
  "I want to get my finances in order",
  "I want to stop procrastinating",
  "I want to learn to code",
  "I want to write every day",
];

type Step = "goal" | "why" | "generating" | "pick" | "plan" | "crisis";

export default function PlanFlow({ onDone }: { onDone?: () => void }) {
  const [step, setStep] = useState<Step>("goal");
  const [goalInput, setGoalInput] = useState("");
  const [whyInput, setWhyInput] = useState("");
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [seed, setSeed] = useState(0);
  const adoptPlan = useStore((s) => s.adoptPlan);
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const navigate = useNavigate();

  function skip() {
    // Without this, the /app route guard would bounce a never-onboarded
    // user straight back here in a loop.
    completeOnboarding();
    navigate("/app");
  }

  async function generate(nextSeed: number) {
    setStep("generating");
    const result = await createPlan(goalInput, nextSeed);
    if (result.crisis) {
      setStep("crisis");
      return;
    }
    setDraft(result);
    setSeed(nextSeed);
    setStep("pick");
  }

  function adopt() {
    if (!draft) return;
    const purpose = whyInput.trim() || draft.purpose;
    adoptPlan(draft, purpose, whyInput.trim() === "");
    onDone?.();
    navigate("/app");
  }

  if (step === "goal") {
    return (
      <StepShell
        title="Who do you want to become?"
        subtitle="Say it however it comes out — a goal, a feeling, even a frustration. The AI turns it into a plan."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (goalInput.trim().length >= 3) setStep("why");
          }}
        >
          <input
            autoFocus
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            placeholder="I want to become…"
            aria-label="Your goal"
            className="w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-lg outline-none transition-colors placeholder:text-zinc-400 focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-600"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <Chip key={ex} onClick={() => setGoalInput(ex)}>
                {ex}
              </Chip>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={skip}>
              Skip for now
            </Button>
            <Button type="submit" variant="primary" size="lg" disabled={goalInput.trim().length < 3}>
              Continue <ArrowRight size={17} />
            </Button>
          </div>
        </form>
      </StepShell>
    );
  }

  if (step === "why") {
    return (
      <StepShell
        title="Why does this matter to you?"
        subtitle="On the hard days, this is what we'll remind you of. Skip it and the AI will suggest one you can edit later."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void generate(0);
          }}
        >
          <textarea
            autoFocus
            value={whyInput}
            onChange={(e) => setWhyInput(e.target.value)}
            placeholder="So that I can…"
            aria-label="Why this goal matters"
            rows={3}
            className="w-full resize-none rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-lg outline-none transition-colors placeholder:text-zinc-400 focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-600"
          />
          <div className="mt-8 flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => void generate(0)}>
              Skip — suggest one for me
            </Button>
            <Button type="submit" variant="primary" size="lg">
              Build my plan <Sparkles size={17} />
            </Button>
          </div>
        </form>
      </StepShell>
    );
  }

  if (step === "generating") {
    return <GeneratingScreen />;
  }

  if (step === "crisis") {
    return (
      <StepShell title="Let's pause here" subtitle="">
        <Card tone="accent" className="space-y-4">
          <p className="text-[15px] leading-relaxed">
            What you wrote sounds heavier than something a habit plan should carry. You deserve
            real support from a real person — and reaching out is the strongest move available to
            you right now.
          </p>
          <ul className="space-y-3">
            {CRISIS_RESOURCES.map((r) => (
              <li key={r.label}>
                <p className="font-semibold">{r.label}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{r.detail}</p>
              </li>
            ))}
          </ul>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            DisciplineU will be here whenever you want it. No streaks lost, no judgment — ever.
          </p>
        </Card>
        <div className="mt-6">
          <Button variant="soft" onClick={() => setStep("goal")}>
            Go back
          </Button>
        </div>
      </StepShell>
    );
  }

  if (!draft) return null;

  if (step === "pick") {
    return (
      <PracticePicker
        draft={draft}
        onBack={() => setStep("goal")}
        onContinue={(habits) => {
          setDraft({ ...draft, habits });
          setStep("plan");
        }}
      />
    );
  }

  // step === "plan"
  return (
    <PlanProposal
      draft={draft}
      whyInput={whyInput}
      onEditDraft={setDraft}
      onRegenerate={() => void generate(seed + 1)}
      onAdopt={adopt}
      onBack={() => setStep("pick")}
    />
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-rise mx-auto w-full max-w-xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      {subtitle && (
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      )}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function GeneratingScreen() {
  const stages = thinkingStages();
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, stages.length - 1)), 480);
    return () => clearInterval(t);
  }, [stages.length]);
  return (
    <div className="mx-auto w-full max-w-xl" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <Sparkles className="animate-pulse-soft text-amber-500 dark:text-amber-400" size={20} />
        <p className="text-lg font-medium">{stages[stage]}</p>
      </div>
      <div className="mt-8 space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-11/12" />
      </div>
    </div>
  );
}

function PlanProposal({
  draft,
  whyInput,
  onEditDraft,
  onRegenerate,
  onAdopt,
  onBack,
}: {
  draft: PlanDraft;
  whyInput: string;
  onEditDraft: (d: PlanDraft) => void;
  onRegenerate: () => void;
  onAdopt: () => void;
  onBack: () => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const editRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing !== null) editRef.current?.focus();
  }, [editing]);

  const purpose = whyInput.trim() || draft.purpose;

  function swapHabit(index: number) {
    const others = draft.habits.filter((_, i) => i !== index).map((x) => x.title);
    const replacement = alternateHabit(draft.category, [...others, draft.habits[index].title]);
    const habits = [...draft.habits];
    habits[index] = replacement;
    onEditDraft({ ...draft, habits });
  }

  function removeHabit(index: number) {
    if (draft.habits.length <= 2) return;
    onEditDraft({ ...draft, habits: draft.habits.filter((_, i) => i !== index) });
  }

  function renameHabit(index: number, title: string) {
    const habits = [...draft.habits];
    habits[index] = { ...habits[index], title };
    onEditDraft({ ...draft, habits });
  }

  return (
    <div className="animate-rise mx-auto w-full max-w-xl pb-12">
      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Your plan</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {draft.title}
      </h1>
      <p className="mt-2 text-[15px] text-zinc-500 dark:text-zinc-400">
        You're becoming <span className="font-medium text-zinc-700 dark:text-zinc-200">{draft.identity}</span>.
      </p>

      {draft.careNote && (
        <Card tone="accent" className="mt-6">
          <p className="text-sm leading-relaxed">{draft.careNote}</p>
        </Card>
      )}

      <div className="mt-6">
        <SectionLabel>Your why</SectionLabel>
        <p className="mt-2 text-[15px] italic leading-relaxed text-zinc-700 dark:text-zinc-300">
          “{purpose}”
          {!whyInput.trim() && (
            <span className="ml-2 not-italic text-xs text-zinc-400 dark:text-zinc-500">
              AI-suggested — editable anytime
            </span>
          )}
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <SectionLabel>Daily practice</SectionLabel>
        {draft.habits.map((habit, i) => (
          <Card key={`${habit.title}-${i}`} className="group">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {editing === i ? (
                  <input
                    ref={editRef}
                    defaultValue={habit.title}
                    aria-label="Edit habit name"
                    onBlur={(e) => {
                      if (e.target.value.trim()) renameHabit(i, e.target.value.trim());
                      setEditing(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setEditing(null);
                    }}
                    className="w-full rounded-lg border border-amber-400 bg-transparent px-2 py-1 font-medium outline-none"
                  />
                ) : (
                  <p className="font-medium">{habit.title}</p>
                )}
                <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {habit.why}
                </p>
                <p className="mt-2 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                  {habit.cadence.type === "daily" ? "Daily" : `${habit.cadence.times}× a week`}
                  {habit.timeHint !== "anytime" && ` · ${habit.timeHint}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <IconButton label={`Edit ${habit.title}`} onClick={() => setEditing(i)}>
                  <Pencil size={14} />
                </IconButton>
                <IconButton label={`Swap ${habit.title} for another habit`} onClick={() => swapHabit(i)}>
                  <RefreshCw size={14} />
                </IconButton>
                {draft.habits.length > 2 && (
                  <IconButton label={`Remove ${habit.title}`} onClick={() => removeHabit(i)}>
                    <X size={14} />
                  </IconButton>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <SectionLabel>First month milestones</SectionLabel>
        <ol className="mt-3 space-y-2">
          {draft.milestones.map((m, i) => (
            <li key={m} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {i + 1}
              </span>
              {m}
            </li>
          ))}
        </ol>
      </div>

      <div className="sticky bottom-20 mt-10 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 md:bottom-4">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onBack}>
            Back
          </Button>
          <Button variant="ghost" size="sm" onClick={onRegenerate}>
            <RefreshCw size={14} /> Regenerate
          </Button>
        </div>
        <Button variant="primary" size="lg" onClick={onAdopt}>
          <Check size={17} /> Start today
        </Button>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-lg p-2 text-zinc-400 opacity-60 transition-all hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
    >
      {children}
    </button>
  );
}
