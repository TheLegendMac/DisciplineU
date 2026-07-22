import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Clock, Flag, MessageSquareHeart, PenLine, Sparkles } from "lucide-react";
import { useStore } from "../lib/store";
import {
  activeGoals,
  consistency7,
  currentMilestone,
  groupByDayPart,
  needsRecovery,
  nextAction,
  reviewDue,
  todayActions,
  weeksShowingUp,
  type TodayAction,
} from "../lib/selectors";
import { daysBetween, formatLong, formatTime, todayKey } from "../lib/dates";
import { allDoneCopy, recoveryCopy } from "../lib/ai/engine";
import { Button, Card, EmptyState, ProgressRing, SectionLabel } from "../components/ui";

export default function Today() {
  const goals = useStore((s) => s.goals);
  const completions = useStore((s) => s.completions);
  const reviews = useStore((s) => s.reviews);
  const tone = useStore((s) => s.tone);
  const toggleHabit = useStore((s) => s.toggleHabit);
  const toggleMilestone = useStore((s) => s.toggleMilestone);
  const updateHabit = useStore((s) => s.updateHabit);
  const [justOne, setJustOne] = useState(false);

  const today = todayKey();
  const active = activeGoals(goals);
  const actions = todayActions(goals, completions, today);
  const next = nextAction(actions);
  const doneCount = actions.filter((a) => a.done).length;
  const pct = actions.length > 0 ? Math.round((doneCount / actions.length) * 100) : 0;
  const consistency = consistency7(goals, completions, today);
  const weeks = weeksShowingUp(completions, today);
  const recovery = needsRecovery(goals, completions, today);
  const primaryGoal = active[0];
  const oldestGoal = active.length
    ? active.reduce((min, g) => (g.createdAt < min ? g.createdAt : min), today)
    : undefined;
  const showReviewNudge = reviewDue(reviews[0]?.date, oldestGoal, today) && !recovery;

  if (active.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader today={today} identityLine={null} />
        <div className="mt-10">
          <EmptyState
            icon={<Sparkles size={28} />}
            title="No plan yet — that's one sentence away"
            body="Tell the AI who you want to become and it will build your first daily plan. It takes about a minute."
            action={
              <Link to="/app/new">
                <Button variant="primary">Create your plan</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const identityLine = primaryGoal
    ? `Day ${daysBetween(primaryGoal.createdAt, today) + 1} of becoming ${primaryGoal.identity}`
    : null;

  const visibleActions = justOne && next ? [next] : actions;
  const milestoneGoal = active.find((g) => currentMilestone(g));
  const milestone = milestoneGoal ? currentMilestone(milestoneGoal) : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader today={today} identityLine={identityLine} />

      {recovery && !justOne && (
        <RecoveryCard
          purpose={primaryGoal?.purpose ?? ""}
          onJustOne={() => setJustOne(true)}
        />
      )}

      {/* Next best action */}
      {next && !recovery && (
        <Card tone="accent" className="mt-8 animate-rise">
          <SectionLabel>Next best action</SectionLabel>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-lg font-semibold">{next.habit.title}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{next.habit.why}</p>
            </div>
            <Button
              variant="primary"
              onClick={() => toggleHabit(next.habit.id, today)}
              aria-label={`Mark ${next.habit.title} as done`}
            >
              <Check size={17} /> Done
            </Button>
          </div>
        </Card>
      )}

      {/* All-done state */}
      {!next && actions.length > 0 && (
        <Card tone="accent" className="mt-8 animate-rise">
          <div className="flex items-center gap-4">
            <ProgressRing value={100} size={56} stroke={6} label="Today" />
            <p className="text-[15px] font-medium leading-relaxed">{allDoneCopy(tone)}</p>
          </div>
        </Card>
      )}

      {/* Today agenda */}
      {justOne ? (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <SectionLabel>Just one thing</SectionLabel>
            <button
              className="text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
              onClick={() => setJustOne(false)}
            >
              Show everything
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {visibleActions.map((action) => (
              <ActionRow
                key={action.habit.id}
                action={action}
                onToggle={() => toggleHabit(action.habit.id, today)}
                onSetTime={(time) => updateHabit(action.goal.id, action.habit.id, { time })}
              />
            ))}
          </ul>
        </div>
      ) : (
        groupByDayPart(visibleActions).map((group) => (
          <div key={group.part} className="mt-8">
            <SectionLabel>{group.label}</SectionLabel>
            <ul className="mt-3 space-y-2">
              {group.actions.map((action) => (
                <ActionRow
                  key={action.habit.id}
                  action={action}
                  onToggle={() => toggleHabit(action.habit.id, today)}
                  onSetTime={(time) => updateHabit(action.goal.id, action.habit.id, { time })}
                />
              ))}
            </ul>
          </div>
        ))
      )}

      {!justOne && <JournalLine today={today} />}

      {/* Footer row: progress + milestone + purpose */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Card>
          <SectionLabel>This week</SectionLabel>
          <div className="mt-4 flex items-center gap-5">
            <ProgressRing value={consistency ?? 0} label="Weekly consistency" />
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              <p>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{pct}%</span> of
                today done
              </p>
              <p className="mt-1">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {weeks} {weeks === 1 ? "week" : "weeks"}
                </span>{" "}
                showing up
              </p>
            </div>
          </div>
        </Card>

        {milestone && milestoneGoal && (
          <Card>
            <SectionLabel>Next milestone</SectionLabel>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Flag size={16} className="mt-0.5 shrink-0 text-amber-500 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-medium leading-snug">{milestone.title}</p>
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    Week {milestone.week} · {milestoneGoal.title}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="soft"
                onClick={() => toggleMilestone(milestoneGoal.id, milestone.id)}
              >
                Done
              </Button>
            </div>
          </Card>
        )}
      </div>

      {showReviewNudge && (
        <Link to="/app/review" className="mt-4 block">
          <Card className="flex items-center justify-between gap-3 transition-colors hover:border-amber-400/50">
            <div className="flex items-center gap-3">
              <MessageSquareHeart size={17} className="shrink-0 text-amber-500 dark:text-amber-400" />
              <p className="text-sm font-medium">
                Your weekly review is ready — three questions, and next week's plan gets smarter.
              </p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-zinc-400" />
          </Card>
        </Link>
      )}

      {primaryGoal?.purpose && !recovery && (
        <p className="mt-8 text-center text-sm italic text-zinc-400 dark:text-zinc-500">
          “{primaryGoal.purpose}”
        </p>
      )}
    </div>
  );
}

function PageHeader({ today, identityLine }: { today: string; identityLine: string | null }) {
  return (
    <header>
      <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">{formatLong(today)}</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {identityLine ?? "Today"}
      </h1>
    </header>
  );
}

function RecoveryCard({ purpose, onJustOne }: { purpose: string; onJustOne: () => void }) {
  const tone = useStore((s) => s.tone);
  const copy = recoveryCopy(tone, purpose);
  return (
    <Card tone="accent" className="mt-8 animate-rise">
      <h2 className="font-display text-xl font-semibold">{copy.title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">
        {copy.body}
      </p>
      <div className="mt-4">
        <Button variant="primary" onClick={onJustOne}>
          {copy.cta} <ArrowRight size={16} />
        </Button>
      </div>
    </Card>
  );
}

function ActionRow({
  action,
  onToggle,
  onSetTime,
}: {
  action: TodayAction;
  onToggle: () => void;
  onSetTime: (time: string | undefined) => void;
}) {
  const { habit, done, weekLabel } = action;
  const [editingTime, setEditingTime] = useState(false);
  return (
    <li
      className={`group flex items-center gap-1 rounded-2xl border pr-2 transition-all ${
        done
          ? "border-transparent bg-zinc-50 dark:bg-zinc-900/40"
          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
      }`}
    >
      <button
        onClick={onToggle}
        aria-pressed={done}
        aria-label={`${done ? "Undo" : "Complete"} ${habit.title}`}
        className="flex min-w-0 flex-1 items-center gap-4 py-3.5 pl-4 text-left"
      >
        <span
          aria-hidden
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            done
              ? "border-amber-400 bg-amber-400 text-zinc-950"
              : "border-zinc-300 group-hover:border-amber-400 dark:border-zinc-600"
          }`}
        >
          {done && <Check size={14} strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block font-medium ${done ? "text-zinc-400 line-through decoration-zinc-300 dark:text-zinc-500 dark:decoration-zinc-700" : ""}`}
          >
            {habit.title}
          </span>
          {weekLabel && (
            <span className="mt-0.5 block text-xs text-zinc-400 dark:text-zinc-500">
              {weekLabel}
            </span>
          )}
        </span>
      </button>
      {editingTime ? (
        <input
          type="time"
          autoFocus
          defaultValue={habit.time ?? ""}
          aria-label={`Time for ${habit.title}`}
          onBlur={(e) => {
            onSetTime(e.target.value || undefined);
            setEditingTime(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setEditingTime(false);
          }}
          className="shrink-0 rounded-lg border border-amber-400 bg-transparent px-2 py-1 text-sm tabular-nums outline-none"
        />
      ) : (
        <button
          onClick={() => setEditingTime(true)}
          aria-label={
            habit.time
              ? `Change time for ${habit.title} (currently ${formatTime(habit.time)})`
              : `Set a time for ${habit.title}`
          }
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
            habit.time
              ? "text-amber-600 hover:bg-amber-400/10 dark:text-amber-400"
              : "text-zinc-300 opacity-60 hover:bg-zinc-100 hover:text-zinc-600 focus-visible:opacity-100 group-hover:opacity-100 md:opacity-0 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          }`}
        >
          <Clock size={13} />
          {habit.time ? (
            <span className="tabular-nums">{formatTime(habit.time)}</span>
          ) : (
            <span className="hidden sm:inline">Set time</span>
          )}
        </button>
      )}
    </li>
  );
}

function JournalLine({ today }: { today: string }) {
  const journal = useStore((s) => s.journal);
  const setJournal = useStore((s) => s.setJournal);
  const saved = journal[today] ?? "";
  return (
    <div className="mt-8">
      <SectionLabel>One line about today</SectionLabel>
      <label className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-zinc-300 px-4 py-3 transition-colors focus-within:border-amber-400 dark:border-zinc-700">
        <PenLine size={15} className="shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden />
        <input
          key={today}
          defaultValue={saved}
          placeholder="How did today actually go?"
          aria-label="One line about today"
          maxLength={200}
          onBlur={(e) => setJournal(today, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
        />
      </label>
    </div>
  );
}
