# DisciplineU — Founder-Level Product Review

*The review that shaped V1. Written before the first line of code.*

## Verdict

The core insight is real and the category is winnable — but not with the product as
originally specified. The spec described three products stapled together (an AI planner, a
calendar app, and a habit tracker). V1 ships exactly one: **an AI coach that turns "who I
want to become" into "what I do today," and renegotiates that plan weekly.**

## Market findings

Every incumbent fails in one of three ways:

| Product | What works | Why users quit |
|---|---|---|
| Habitica | Social features (+40% 30-day retention) | HP-loss punishes misses → anxiety → abandonment |
| Streaks | Dead-simple capture | The entire product is the streak; one miss zeroes it |
| Fabulous | Beautiful onboarding, science framing | Rigid "journeys," aggressive upsells |
| Finch | **No punishment ever** — strong retention proof | Pet framing reads childish to half the market |
| Motion/Reclaim | AI calendar automation | Work-productivity tools; nobody opens them to change their life |
| Notion templates | Infinite flexibility | Blank-canvas problem; user must design their own system |

Two research anchors drove the design:

1. **Habits take 59–66 days to form; only ~23% of app users get there** (2024 UniSA
   meta-analysis, 20 studies, n=2,601). The product must survive two months of ordinary
   human inconsistency.
2. **The abstinence violation effect is the #1 churn mechanism**: one miss, treated as
   failure by the app, triggers full abandonment. Reviewers repeatedly note the missing
   feature is "something that notices when you go quiet and helps you start again."

**The gap nobody owns:** converting identity aspiration → adaptive daily plan → kind
recovery. That's the category: not habit tracking, but *AI personal transformation
coaching*. Positioning writes itself: "Habit trackers hand you an empty grid. We hand you
a strategy."

## What I cut (and why)

- **The calendar** (drag-drop, time blocking, auto-scheduling, conflict awareness).
  This is a company-sized feature — Motion and Reclaim raised tens of millions to build
  it — and it *contradicts* the product's own principle: a calendar is a decision surface,
  and our promise is fewer decisions. Replaced with an ordered Today list (max ~5 actions)
  with morning/afternoon/evening hints. Missed daily habits roll over silently by nature;
  missed weekly targets surface in the weekly review, not as guilt.
- **Six habit verbs everywhere** (accept/reject/edit/replace/regenerate/archive/pause).
  Collapsed by context: at proposal time — edit/swap/remove/regenerate; after adoption —
  swap/pause per habit, pause/archive per goal. Same power, third of the surface area.
- **"Strict" coaching personality.** A drill-sergeant mode contradicts "never shame" —
  you cannot A/B your values. Shipped Gentle/Balanced/Direct as a voice setting that
  actually rewrites coach copy (recovery, reviews, insights), not a cosmetic label.
- **Gamification** (XP, avatars, points). Kept only mechanics with behavioral teeth:
  identity progression ("Day 12 of becoming someone who moves daily"), weekly consistency
  % (a miss dents it, never zeroes it), "weeks showing up" (streaks that bend), and
  consistency-based milestones. No numbers that can humiliate.
- **Unlimited goals.** Hard cap of 3 active, onboarding starts with 1, warning at 2.
  Overcommitment is the silent killer of every app in this category.
- **Analytics dashboards.** One Progress page: three stats, a 14-day strip, one AI insight
  sentence. Charts don't retain people; a plan that fits does.
- **Auth + backend.** Local-first, zero-friction: value in under 60 seconds, no account
  wall. This is also the privacy story ("we can't see your goals") and the dev-speed
  story. The state layer keeps a clean sync boundary for when Pro adds cloud sync.

## What I added that wasn't asked for

- **The Recovery flow** — the feature the market data says is missing. After 2+ quiet
  days, Today leads with the user's own "why" and a one-tap "just one thing" mode that
  shrinks the day to a single action. Restart speed, not streak preservation, is the
  retention lever.
- **The plan proposal screen as the hero moment.** The goal→plan transformation is the
  product's magic trick; it gets a dedicated, beautiful, fully editable screen (and it's
  the marketing screenshot).
- **A "why" under every habit.** Coaching is the differentiator; a habit with a reason
  reads like a coach, a habit without one reads like a chore list.
- **Purpose capture with AI fallback**, resurfaced at exactly two moments: quiet daily
  footer, and front-and-center during recovery. Never as decoration.

## AI architecture decision

V1 ships a **deterministic plan engine** (category detection, negative-self-label
reframing, per-category habit libraries with rationale, tone-aware coach copy, weekly
adjustment logic) behind the same async contract a model-backed provider uses. Rationale:
works offline, zero marginal cost, zero latency floor, fully demo-able — and the hard
product problems (what a good plan *is*, how adjustment *feels*) are design problems, not
model problems. `claudeProvider.ts` documents the production path: a thin server proxy →
Claude API (`claude-opus-4-8`, structured outputs, ~$0.03/plan) with the same guardrail
contract. Safety runs client-side *first* either way: crisis input never produces a plan
(it produces 988/crisis-line resources); eating/addiction/clinical input produces a gentle
plan plus a professional-support care note.

## Monetization thesis (placeholder pricing shipped)

Free: one active goal, full loop. Pro ($6/mo, "coming soon"): 3 goals, deeper AI
coaching + written weekly reports, cloud sync. The upgrade trigger is success with goal
#1 — monetizing commitment, not desperation.

## Known risks / not in V1

- No notifications (web V1) — the biggest retention tool is missing until PWA/mobile.
- Local-first means no cross-device continuity until sync ships.
- Deterministic plans have finite variety; fine for validation, not for scale — the
  Claude provider is the first post-validation build.
- The name "DisciplineU" skews drill-sergeant while the product's soul is kind; worth
  testing against alternatives before a public launch.
