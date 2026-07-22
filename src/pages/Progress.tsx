import { BarChart3 } from "lucide-react";
import { useStore } from "../lib/store";
import {
  activeGoals,
  activityGrid,
  activityStrip,
  consistency7,
  totalCompletions,
  weeksShowingUp,
  type DayCell,
} from "../lib/selectors";
import { formatShort, todayKey } from "../lib/dates";
import { progressInsight } from "../lib/ai/engine";
import { Card, EmptyState, SectionLabel } from "../components/ui";

// Cell fills follow the dataviz rules: amber (accent) only for "done",
// neutrals for everything else — a missed day is quiet, never red.
const CELL_STYLE = {
  done: "bg-amber-400",
  partial: "bg-amber-400/40",
  missed: "bg-zinc-200 dark:bg-zinc-800",
  none: "bg-transparent border border-dashed border-zinc-200 dark:border-zinc-800",
  future: "bg-transparent",
} as const;

const CELL_LABEL = {
  done: "all done",
  partial: "partly done",
  missed: "nothing logged",
  none: "no plan yet",
  future: "not yet",
} as const;

export default function Progress() {
  const goals = useStore((s) => s.goals);
  const completions = useStore((s) => s.completions);
  const tone = useStore((s) => s.tone);

  const today = todayKey();
  const active = activeGoals(goals);
  const consistency = consistency7(goals, completions, today);
  const weeks = weeksShowingUp(completions, today);
  const total = totalCompletions(completions);
  const strip = activityStrip(goals, completions, today);
  const doneMilestones = goals.flatMap((g) => g.milestones).filter((m) => m.done).length;

  if (active.length === 0 && total === 0) {
    return (
      <Shell>
        <EmptyState
          icon={<BarChart3 size={28} />}
          title="Progress starts with one checkmark"
          body="Once you begin completing actions, this page shows your consistency, your weeks of showing up, and what's working."
        />
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          value={consistency !== null ? `${consistency}%` : "—"}
          label="This week's consistency"
        />
        <StatTile value={String(weeks)} label={weeks === 1 ? "Week showing up" : "Weeks showing up"} />
        <StatTile value={String(total)} label="Actions completed" />
      </div>

      {/* Insight */}
      <Card tone="accent" className="mt-4">
        <p className="text-[15px] leading-relaxed">{progressInsight(tone, consistency)}</p>
      </Card>

      {/* 14-day strip */}
      <div className="mt-8">
        <SectionLabel>Last 14 days</SectionLabel>
        <div className="mt-3 flex items-end gap-1.5" role="img" aria-label="Activity for the last 14 days">
          {strip.map((cell) => (
            <div
              key={cell.date}
              title={`${formatShort(cell.date)}: ${CELL_LABEL[cell.state]}`}
              className={`h-9 flex-1 rounded-md ${CELL_STYLE[cell.state]}`}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
          <span>{formatShort(strip[0].date)}</span>
          <span>Today</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <LegendItem swatch={CELL_STYLE.done} label="All done" />
          <LegendItem swatch={CELL_STYLE.partial} label="Partly done" />
          <LegendItem swatch={CELL_STYLE.missed} label="Rest day" />
        </div>
      </div>

      {/* 12-week heatmap */}
      <div className="mt-10">
        <SectionLabel>Last 12 weeks</SectionLabel>
        <Heatmap grid={activityGrid(goals, completions, today)} />
      </div>

      {/* Milestones */}
      <div className="mt-10">
        <SectionLabel>Milestones</SectionLabel>
        {doneMilestones === 0 ? (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Your first milestone is usually a week away. It'll show up here when it lands.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {goals
              .flatMap((g) => g.milestones.filter((m) => m.done).map((m) => ({ goal: g, m })))
              .map(({ goal, m }) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 text-sm dark:border-zinc-800"
                >
                  <span className="font-medium">{m.title}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{goal.title}</span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Progress</h1>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <Card className="!p-4">
      <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs leading-snug text-zinc-500 dark:text-zinc-400">{label}</p>
    </Card>
  );
}

function Heatmap({ grid }: { grid: DayCell[][] }) {
  const first = grid[0]?.[0];
  const last = grid[grid.length - 1]?.[6];
  return (
    <div>
      <div
        className="mt-3 flex gap-1 overflow-x-auto pb-1"
        role="img"
        aria-label="Daily activity for the last 12 weeks, one column per week"
      >
        <div
          aria-hidden
          className="mr-1 flex shrink-0 flex-col justify-between py-0.5 text-[9px] leading-none text-zinc-400 dark:text-zinc-500"
        >
          <span>Mon</span>
          <span>Thu</span>
          <span>Sun</span>
        </div>
        {grid.map((week) => (
          <div key={week[0].date} className="flex shrink-0 flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={`${formatShort(cell.date)}: ${CELL_LABEL[cell.state]}`}
                className={`h-3.5 w-3.5 rounded-[4px] ${CELL_STYLE[cell.state]}`}
              />
            ))}
          </div>
        ))}
      </div>
      {first && last && (
        <div className="mt-1.5 flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
          <span>{formatShort(first.date)}</span>
          <span>{formatShort(last.date)}</span>
        </div>
      )}
    </div>
  );
}

function LegendItem({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={`h-2.5 w-2.5 rounded-sm ${swatch}`} />
      {label}
    </span>
  );
}
