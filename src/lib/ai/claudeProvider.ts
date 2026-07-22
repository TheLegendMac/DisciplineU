// PRODUCTION AI PROVIDER — design spec, not wired in V1.
//
// V1 ships the deterministic localEngine so the product works offline, with
// zero latency floor and zero marginal cost. When we add accounts + a backend,
// this provider replaces it behind the same `createPlan` contract.
//
// Architecture: the browser NEVER holds an Anthropic API key. Plan generation
// goes through a thin server route (e.g. POST /api/plan) which calls the
// Claude API with the official SDK and returns a validated PlanDraft.
//
// Server route sketch (@anthropic-ai/sdk):
//
//   import Anthropic from "@anthropic-ai/sdk";
//   const client = new Anthropic(); // key from server env
//
//   const response = await client.messages.parse({
//     model: "claude-opus-4-8",
//     max_tokens: 2048,
//     system: PLAN_SYSTEM_PROMPT,
//     messages: [{ role: "user", content: JSON.stringify({ goal, why, tone }) }],
//     output_config: { format: zodOutputFormat(PlanDraftSchema) },
//   });
//
// Cost note: Opus 4.8 is $5/$25 per MTok. A plan generation is ~1K in / ~1K out
// ≈ $0.03 — fine at consumer scale for a once-per-goal action. Weekly review
// summaries are smaller. Cache the (stable) system prompt with cache_control.
//
// The system prompt must encode the same product values the local engine does:
// - reframe negative self-labels into constructive goals; never echo them back
// - 3–4 habits max, each with a one-sentence "why" grounded in behavior science
// - milestones measure consistency, never outcomes (no scale weights, no PRs)
// - refuse to generate restriction/crisis plans; return the guardrail signal
//   so the client renders the same supportive screens localEngine triggers
//
// Client-side guardrails in guardrails.ts still run FIRST, before any network
// call — crisis input never leaves the device.

export const PLAN_SYSTEM_PROMPT = `You are the planning engine for DisciplineU,
an app that turns who someone wants to become into a small daily plan.

Given a goal (and optionally a "why" and coach tone), return JSON matching the
provided schema: a constructive goal title, an identity statement ("someone
who…"), a purpose suggestion, 3-4 habits (title, one-sentence why, cadence of
daily or N-times-per-week, time-of-day hint), and 4 weekly milestones that
measure consistency rather than outcomes.

Rules:
- If the goal is a negative self-label ("I'm lazy"), reframe it into a
  constructive goal. Never repeat the label.
- Habits must be small enough to do on a bad day.
- Never generate plans around restriction, punishment, or self-harm. For
  sensitive topics (eating, addiction, clinical conditions) include a careNote
  encouraging professional support and keep habits gentle and additive.
- Warm, specific, never saccharine. No exclamation marks.`;
