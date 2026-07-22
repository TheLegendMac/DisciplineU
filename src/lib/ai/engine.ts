// Engine facade. Pages import from here, never from a specific engine,
// so swapping the local engine for the Claude provider is a one-line change.

import type { PlanDraft } from "../types";
import { generatePlan } from "./localEngine";

export * from "./localEngine";
export { checkInput, CRISIS_RESOURCES } from "./guardrails";

const THINKING_STAGES = [
  "Reading your goal…",
  "Choosing high-leverage habits…",
  "Balancing your week…",
  "Writing your plan…",
];

export function thinkingStages(): string[] {
  return THINKING_STAGES;
}

// Async so the UI contract already matches a network-backed provider.
// The staged delay makes plan generation feel considered rather than canned.
export async function createPlan(input: string, seed = 0): Promise<PlanDraft> {
  const delay = seed === 0 ? 1800 : 900;
  await new Promise((r) => setTimeout(r, delay));
  return generatePlan(input, seed);
}
