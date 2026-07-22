import { useState } from "react";
import { Link } from "react-router-dom";
import { Archive, Check, Pause, Pencil, Play, Plus, RefreshCw, Target } from "lucide-react";
import type { Goal, Habit } from "../lib/types";
import { useStore } from "../lib/store";
import { alternateHabit } from "../lib/ai/engine";
import { Button, Card, Chip, EmptyState, Modal, SectionLabel } from "../components/ui";

export default function Goals() {
  const goals = useStore((s) => s.goals);
  const visible = goals.filter((g) => g.status !== "archived");
  const archived = goals.filter((g) => g.status === "archived");
  const [expanded, setExpanded] = useState<string | null>(
    visible.length === 1 ? visible[0].id : null,
  );

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Goals</h1>
        <Link to="/app/new">
          <Button variant="primary" size="sm">
            <Plus size={15} /> New goal
          </Button>
        </Link>
      </header>

      {visible.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<Target size={28} />}
            title="No goals yet"
            body="Your first goal takes one sentence. The AI does the rest."
            action={
              <Link to="/app/new">
                <Button variant="primary">Create a goal</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {visible.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              expanded={expanded === goal.id}
              onToggle={() => setExpanded(expanded === goal.id ? null : goal.id)}
            />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div className="mt-12">
          <SectionLabel>Archived</SectionLabel>
          <div className="mt-3 space-y-2">
            {archived.map((goal) => (
              <ArchivedRow key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  expanded,
  onToggle,
}: {
  goal: Goal;
  expanded: boolean;
  onToggle: () => void;
}) {
  const setGoalStatus = useStore((s) => s.setGoalStatus);
  const setPurpose = useStore((s) => s.setPurpose);
  const toggleMilestone = useStore((s) => s.toggleMilestone);
  const [editingPurpose, setEditingPurpose] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const paused = goal.status === "paused";
  const doneMilestones = goal.milestones.filter((m) => m.done).length;

  return (
    <Card className={paused ? "opacity-70" : ""}>
      <button className="w-full text-left" onClick={onToggle} aria-expanded={expanded}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold">{goal.title}</p>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Becoming {goal.identity}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {paused && <Chip>Paused</Chip>}
            <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
              {doneMilestones}/{goal.milestones.length} milestones
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="animate-rise mt-5 space-y-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          {/* Purpose */}
          <div>
            <SectionLabel>Your why</SectionLabel>
            {editingPurpose ? (
              <textarea
                autoFocus
                defaultValue={goal.purpose}
                rows={2}
                aria-label="Edit your why"
                onBlur={(e) => {
                  if (e.target.value.trim()) setPurpose(goal.id, e.target.value.trim());
                  setEditingPurpose(false);
                }}
                className="mt-2 w-full resize-none rounded-xl border border-amber-400 bg-transparent px-3 py-2 text-sm outline-none"
              />
            ) : (
              <button
                className="group mt-2 flex w-full items-start justify-between gap-2 text-left"
                onClick={() => setEditingPurpose(true)}
              >
                <p className="text-sm italic leading-relaxed text-zinc-600 dark:text-zinc-300">
                  “{goal.purpose}”
                </p>
                <Pencil
                  size={13}
                  className="mt-1 shrink-0 text-zinc-300 group-hover:text-zinc-500 dark:text-zinc-600"
                />
              </button>
            )}
          </div>

          {/* Habits */}
          <div>
            <SectionLabel>Habits</SectionLabel>
            <ul className="mt-3 space-y-2">
              {goal.habits.map((habit) => (
                <HabitRow key={habit.id} goal={goal} habit={habit} />
              ))}
            </ul>
          </div>

          {/* Milestones */}
          <div>
            <SectionLabel>Milestones</SectionLabel>
            <ul className="mt-3 space-y-2">
              {goal.milestones.map((m) => (
                <li key={m.id}>
                  <button
                    className="flex w-full items-center gap-3 text-left text-sm"
                    onClick={() => toggleMilestone(goal.id, m.id)}
                    aria-pressed={m.done}
                  >
                    <span
                      aria-hidden
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        m.done
                          ? "border-amber-400 bg-amber-400 text-zinc-950"
                          : "border-zinc-300 dark:border-zinc-600"
                      }`}
                    >
                      {m.done && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className={m.done ? "text-zinc-400 line-through dark:text-zinc-500" : ""}>
                      {m.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Goal actions */}
          <div className="flex gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <Button
              size="sm"
              variant="soft"
              onClick={() => setGoalStatus(goal.id, paused ? "active" : "paused")}
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
              {paused ? "Resume" : "Pause"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setArchiveConfirm(true)}>
              <Archive size={14} /> Archive
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={archiveConfirm}
        onClose={() => setArchiveConfirm(false)}
        title="Archive this goal?"
      >
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Archiving removes “{goal.title}” from your day but keeps its history. Retiring a goal
          that no longer fits is a decision, not a failure — you can restore it anytime.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setArchiveConfirm(false)}>
            Keep it
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setGoalStatus(goal.id, "archived");
              setArchiveConfirm(false);
            }}
          >
            Archive
          </Button>
        </div>
      </Modal>
    </Card>
  );
}

function HabitRow({ goal, habit }: { goal: Goal; habit: Habit }) {
  const updateHabit = useStore((s) => s.updateHabit);
  const replaceHabit = useStore((s) => s.replaceHabit);
  const paused = habit.status === "paused";

  function swap() {
    const exclude = goal.habits.map((x) => x.title);
    replaceHabit(goal.id, habit.id, alternateHabit(goal.category, exclude));
  }

  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-xl border border-zinc-100 px-3 py-2.5 dark:border-zinc-800 ${paused ? "opacity-60" : ""}`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">{habit.title}</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {habit.cadence.type === "daily" ? "Daily" : `${habit.cadence.times}× a week`}
          {paused && " · paused"}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          aria-label={`Swap ${habit.title} for another habit`}
          onClick={swap}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <RefreshCw size={14} />
        </button>
        <button
          aria-label={paused ? `Resume ${habit.title}` : `Pause ${habit.title}`}
          onClick={() =>
            updateHabit(goal.id, habit.id, { status: paused ? "active" : "paused" })
          }
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
        </button>
      </div>
    </li>
  );
}

function ArchivedRow({ goal }: { goal: Goal }) {
  const setGoalStatus = useStore((s) => s.setGoalStatus);
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{goal.title}</p>
      <Button size="sm" variant="ghost" onClick={() => setGoalStatus(goal.id, "active")}>
        Restore
      </Button>
    </div>
  );
}
