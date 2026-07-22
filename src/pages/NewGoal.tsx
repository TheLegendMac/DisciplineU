import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PlanFlow from "../components/PlanFlow";
import { Card } from "../components/ui";
import { useStore } from "../lib/store";
import { activeGoals } from "../lib/selectors";

export default function NewGoal() {
  const goals = useStore((s) => s.goals);
  const activeCount = activeGoals(goals).length;

  return (
    <div className="mx-auto max-w-xl">
      <Link
        to="/app/goals"
        className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft size={15} /> Back to goals
      </Link>

      {activeCount >= 3 ? (
        <Card tone="accent">
          <h1 className="text-lg font-semibold">Three active goals is the ceiling — on purpose.</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            Every study of habit change points the same way: fewer commitments, kept, beat many
            commitments, abandoned. Pause or archive a goal on the Goals page to make room for
            this one.
          </p>
        </Card>
      ) : (
        <>
          {activeCount === 2 && (
            <Card tone="accent" className="mb-8">
              <p className="text-sm leading-relaxed">
                This will be your third active goal — the maximum. Consider whether one of your
                current goals could pause while you build this one. Depth beats breadth.
              </p>
            </Card>
          )}
          <PlanFlow />
        </>
      )}
    </div>
  );
}
