import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, HeartHandshake, RefreshCw, Sparkles } from "lucide-react";
import { useStore } from "../lib/store";
import { formatLong, todayKey } from "../lib/dates";
import { Button, Card, Logo } from "../components/ui";

export default function Landing() {
  const navigate = useNavigate();
  const seedDemo = useStore((s) => s.seedDemo);
  const onboarded = useStore((s) => s.onboarded);

  function openDemo() {
    seedDemo();
    navigate("/app");
  }

  return (
    <div className="min-h-dvh">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-white/80 backdrop-blur-lg dark:border-zinc-800/60 dark:bg-[#0b0b0e]/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Logo />
          <nav className="flex items-center gap-2" aria-label="Site">
            {onboarded ? (
              <Link to="/app">
                <Button variant="primary" size="sm">
                  Open app
                </Button>
              </Link>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={openDemo}>
                  Live demo
                </Button>
                <Link to="/onboarding">
                  <Button variant="primary" size="sm">
                    Start free
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:pt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(251,191,36,0.10),transparent)]"
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              The AI personal transformation coach
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
              Tell us who you want to become.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
              DisciplineU turns that answer into a small daily plan that adapts to your real
              life — built by AI, kind by design. No empty grids. No broken streaks. No shame.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/onboarding">
                <Button variant="primary" size="lg">
                  Start your plan — free <ArrowRight size={17} />
                </Button>
              </Link>
              <Button variant="soft" size="lg" onClick={openDemo}>
                Explore the live demo
              </Button>
            </div>
            <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
              No account. No credit card. Your data never leaves your device.
            </p>
          </div>

          {/* Product mock */}
          <div className="relative mx-auto mt-16 max-w-md">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl shadow-amber-500/5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-medium text-zinc-400">{formatLong(todayKey())}</p>
              <p className="mt-1 font-display text-lg font-semibold">
                Day 24 of becoming someone who takes care of their body
              </p>
              <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Next best action
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Walk for 20 minutes</p>
                  <span className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-zinc-950">
                    Done
                  </span>
                </div>
              </div>
              {["Drink water before anything else", "Strength session", "Wind down by 10:30"].map(
                (t, i) => (
                  <div
                    key={t}
                    className="mt-2 flex items-center gap-3 rounded-2xl border border-zinc-100 px-4 py-3 dark:border-zinc-800"
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        i === 0
                          ? "border-amber-400 bg-amber-400 text-zinc-950"
                          : "border-zinc-300 dark:border-zinc-600"
                      }`}
                    >
                      {i === 0 && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span
                      className={`text-sm ${i === 0 ? "text-zinc-400 line-through" : "font-medium"}`}
                    >
                      {t}
                    </span>
                  </div>
                ),
              )}
              <p className="mt-4 text-center text-xs italic text-zinc-400">
                “So I have the energy to be fully present with my kids after work.”
              </p>
            </div>
          </div>
        </section>

        {/* Why it's different */}
        <section className="border-t border-zinc-100 px-5 py-20 dark:border-zinc-800/60">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Habit trackers hand you an empty grid.
              <br className="hidden sm:block" /> We hand you a strategy.
            </h2>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              <ValueCard
                icon={<Sparkles size={19} />}
                title="A plan, not a blank page"
                body="Say the goal in one sentence — “I want to become healthier.” The AI decomposes it into 3–4 small daily actions, each with the reason it works. Setup takes a minute, not an evening."
              />
              <ValueCard
                icon={<HeartHandshake size={19} />}
                title="Weeks that bend, don't break"
                body="Research is clear: one broken streak is where most people quit — so we don't keep fragile streaks. We count weeks of showing up, and when you go quiet, we help you restart instead of shaming you."
              />
              <ValueCard
                icon={<RefreshCw size={19} />}
                title="A plan that adapts weekly"
                body="Every week your coach asks what worked and what felt heavy — then reshapes the plan. Habits that drag get smaller. Habits that click get protected. Static lists die; this one doesn't."
              />
            </div>
          </div>
        </section>

        {/* Transformations */}
        <section className="border-t border-zinc-100 px-5 py-20 dark:border-zinc-800/60">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
              From one sentence to a working plan
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <TransformCard
                input="“I want to be more confident socially.”"
                items={[
                  "Start one genuine conversation — daily",
                  "Say yes to one social thing — weekly",
                  "Practice your 30-second introduction — 3× a week",
                  "Note one social win — nightly",
                ]}
                milestone="Milestone: introduce yourself without rehearsing"
              />
              <TransformCard
                input="“I'm lazy.”"
                reframed="Reframed by AI: Build consistent follow-through"
                items={[
                  "Plan tomorrow in 5 minutes — nightly",
                  "Most important task before noon — daily",
                  "One 45-minute phone-free block — daily",
                  "Weekly reset: clear desk and inboxes",
                ]}
                milestone="Milestone: a month of keeping promises to yourself"
              />
            </div>
            <p className="mx-auto mt-8 max-w-lg text-center text-sm leading-relaxed text-zinc-400 dark:text-zinc-500">
              Negative self-talk in, constructive plan out. DisciplineU never echoes a label back
              at you — it converts it into behavior.
            </p>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-t border-zinc-100 px-5 py-20 dark:border-zinc-800/60">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
              Built for people who've quit other apps
            </h2>
            <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
              Illustrative quotes for this preview release
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <Quote
                text="Every tracker I tried died the day I broke a streak. This is the first one where a bad week didn't end with me deleting the app."
                who="Jordan — third attempt at consistency"
              />
              <Quote
                text="I typed one sentence and it gave me a week I could actually do. The 'why' under each habit is what got me — it reads like a coach, not a checklist."
                who="Sam — new parent, zero free time"
              />
              <Quote
                text="The weekly review is the feature. It made my hardest habit smaller instead of guilting me about it, and somehow that's what made me keep it."
                who="Riley — recovering overplanner"
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-zinc-100 px-5 py-20 dark:border-zinc-800/60">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight">Pricing</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <Card className="text-left">
                <p className="font-semibold">Free</p>
                <p className="mt-1 text-3xl font-semibold">$0</p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {["One active goal", "AI plan generation", "Weekly reviews", "All progress tools"].map(
                    (f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check size={14} className="text-amber-500" /> {f}
                      </li>
                    ),
                  )}
                </ul>
              </Card>
              <Card className="border-amber-400/40 text-left">
                <p className="font-semibold">
                  Pro <span className="ml-1 text-xs font-medium text-amber-500">coming soon</span>
                </p>
                <p className="mt-1 text-3xl font-semibold">
                  $6<span className="text-base font-normal text-zinc-400">/mo</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {[
                    "Up to three active goals",
                    "Deeper AI coaching & written weekly reports",
                    "Cloud sync across devices",
                    "Priority access to new coaching tools",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check size={14} className="text-amber-500" /> {f}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
              V1 is free while we learn what's worth paying for.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-zinc-100 px-5 py-20 dark:border-zinc-800/60">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
              Questions
            </h2>
            <div className="mt-10 space-y-3">
              <Faq q="How is this different from a habit tracker?">
                Habit trackers ask you to design your own system, then punish you for missing it.
                DisciplineU starts one step earlier — you bring the <em>who</em>, the AI builds
                the <em>how</em> — and it renegotiates the plan with you every week. Tracking is
                just a side effect.
              </Faq>
              <Faq q="What happens when I miss days?">
                Nothing breaks, because there's nothing brittle to break. We count weeks of
                showing up rather than consecutive days, and after a quiet stretch you get a
                gentle restart — your original “why,” and one small action — instead of a guilt
                trip.
              </Faq>
              <Faq q="Where does my data live?">
                In V1, entirely on your device — we have no servers, no accounts, and no way to
                see your goals. You can export or erase everything in Settings. Optional sync
                will come with Pro, opt-in only.
              </Faq>
              <Faq q="Is this therapy or medical advice?">
                No. DisciplineU is a planning tool. It deliberately avoids diagnosing, treating,
                or advising on medical and mental-health topics, and for sensitive goals it will
                point you toward real professional support alongside a gentle plan.
              </Faq>
              <Faq q="Can I edit what the AI suggests?">
                Everything. Swap, rename, shrink, pause, or delete any habit; rewrite your
                purpose; regenerate the whole plan. The AI drafts, you decide.
              </Faq>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-zinc-100 px-5 py-24 text-center dark:border-zinc-800/60">
          <h2 className="mx-auto max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            A year from now, you'll wish you'd started today.
          </h2>
          <div className="mt-8">
            <Link to="/onboarding">
              <Button variant="primary" size="lg">
                Start your plan — free <ArrowRight size={17} />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-100 px-5 py-10 dark:border-zinc-800/60">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-zinc-400 dark:text-zinc-500 sm:flex-row">
          <Logo size="sm" />
          <nav className="flex gap-6" aria-label="Legal">
            <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" to="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" to="/terms">
              Terms
            </Link>
          </nav>
          <p>© 2026 DisciplineU</p>
        </div>
      </footer>
    </div>
  );
}

function ValueCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{body}</p>
    </Card>
  );
}

function TransformCard({
  input,
  reframed,
  items,
  milestone,
}: {
  input: string;
  reframed?: string;
  items: string[];
  milestone: string;
}) {
  return (
    <Card>
      <p className="font-display text-lg font-semibold">{input}</p>
      {reframed && (
        <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">{reframed}</p>
      )}
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-300">
            <Check size={14} className="shrink-0 text-amber-500" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        {milestone}
      </p>
    </Card>
  );
}

function Quote({ text, who }: { text: string; who: string }) {
  return (
    <Card>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">“{text}”</p>
      <p className="mt-4 text-xs font-medium text-zinc-400 dark:text-zinc-500">{who}</p>
    </Card>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-zinc-200 px-5 py-4 dark:border-zinc-800">
      <summary className="cursor-pointer list-none font-medium marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between">
          {q}
          <span className="text-zinc-400 transition-transform group-open:rotate-45">+</span>
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{children}</p>
    </details>
  );
}
