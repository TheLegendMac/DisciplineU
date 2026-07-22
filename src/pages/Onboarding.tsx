import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, HeartHandshake, Sparkles } from "lucide-react";
import PlanFlow from "../components/PlanFlow";
import { Button, Logo } from "../components/ui";

export default function Onboarding() {
  const [started, setStarted] = useState(false);

  return (
    <div className="min-h-dvh px-4 py-8 sm:px-8">
      <header className="mx-auto flex max-w-xl items-center justify-between">
        <Link to="/" aria-label="DisciplineU home">
          <Logo />
        </Link>
      </header>
      <div className="mx-auto mt-12 max-w-xl sm:mt-20">
        {started ? (
          <PlanFlow />
        ) : (
          <div className="animate-rise">
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Decide who you want to become. We'll handle the how.
            </h1>
            <div className="mt-10 space-y-6">
              <IntroPoint
                icon={<Sparkles size={18} />}
                title="Tell us the goal, not the plan"
                body="One sentence about who you want to become. The AI translates it into a few small daily actions — each with a reason behind it."
              />
              <IntroPoint
                icon={<CalendarCheck size={18} />}
                title="One clear day at a time"
                body="Every morning, DisciplineU answers a single question: what should I do today? No empty grids, no setup homework."
              />
              <IntroPoint
                icon={<HeartHandshake size={18} />}
                title="Kind by design"
                body="Miss a day and nothing shatters. We measure weeks of showing up, not fragile streaks — and when you drift, we help you restart instead of guilting you."
              />
            </div>
            <div className="mt-12">
              <Button variant="primary" size="lg" onClick={() => setStarted(true)}>
                Let's begin
              </Button>
              <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
                Takes about a minute. No account needed — everything stays on your device.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IntroPoint({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400">
        {icon}
      </div>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{body}</p>
      </div>
    </div>
  );
}
