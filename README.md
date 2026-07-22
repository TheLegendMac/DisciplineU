# DisciplineU

An AI personal transformation coach. Tell it who you want to become; it builds a small
daily plan, adapts it weekly, and helps you restart — without shame — when you drift.

**Not** another habit tracker: no empty grids, no fragile streaks, no punishment
mechanics. See [docs/PRODUCT-REVIEW.md](docs/PRODUCT-REVIEW.md) for the founder review
that shaped what got built (and what got cut).

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle
npm run preview    # serve the production build
```

No env vars, no accounts, no backend — all data lives in the browser (localStorage).
From the landing page, **"Explore the live demo"** seeds a realistic 24-day dataset so
every screen has something true to show.

## What's inside

| Route | Screen |
|---|---|
| `/` | Marketing site: hero + product mock, differentiation, transformations, testimonials (marked illustrative), pricing placeholder, FAQ |
| `/onboarding` | 3-step flow: goal → why (both skippable) → AI plan proposal (edit/swap/regenerate) |
| `/app` | Today: next best action, ordered day list, weekly ring, milestone, purpose, recovery flow |
| `/app/goals` | Goal management: habits (swap/pause), milestones, purpose editing, pause/archive |
| `/app/review` | Weekly review: what worked / what was heavy → plan auto-adjusts, coach summary |
| `/app/progress` | Consistency %, weeks showing up, 14-day activity strip, AI insight |
| `/app/settings` | Coach voice (Gentle/Balanced/Direct), theme, JSON export, full erase |
| `/privacy`, `/terms` | Honest preview-release legal pages |

## Architecture

- **Vite + React 19 + TypeScript (strict) + Tailwind v4 + Zustand (persisted) + React Router.**
  Dark-mode first (pre-hydration theme script in `index.html`), responsive (sidebar →
  bottom tabs), reduced-motion aware, keyboard operable.
- `src/lib/ai/` — the "AI":
  - `guardrails.ts` — crisis/sensitive input detection; crisis never generates a plan.
  - `localEngine.ts` — deterministic plan generation: category detection, negative
    self-label reframing, habit libraries with behavioral rationale, tone-aware coach
    copy, weekly-review adjustment logic.
  - `engine.ts` — the facade pages import; async contract matches a network provider.
  - `claudeProvider.ts` — documented production design (server proxy → Claude API with
    structured outputs). Swapping engines is a one-line change.
- `src/lib/` — `types.ts`, `store.ts` (Zustand + persist), `selectors.ts` (pure derived
  state: due-today, consistency, recovery detection, activity strip), `dates.ts`,
  `demo.ts` (deterministic demo dataset).
- `src/components/` — `ui.tsx` (Button/Card/Chip/ProgressRing/Modal/EmptyState/Skeleton/
  Logo), `AppShell.tsx`, `PlanFlow.tsx` (goal → why → generating → proposal, shared by
  onboarding and new-goal).
- `src/pages/` — one file per screen.

## Product rules encoded in code

- Max **3 active goals** (warned at 2) — overcommitment is the category's silent killer.
- Consistency is **weekly**, never a daily streak — one miss can't zero anything.
- **Recovery flow**: 2+ quiet days → your original "why" + a one-action day, not guilt.
- Habits marked "heavy" in review get **smaller** (daily → 5×/wk → …), never lectured.
- Crisis language → crisis resources, no plan. Sensitive goals → gentle plan + care note.
