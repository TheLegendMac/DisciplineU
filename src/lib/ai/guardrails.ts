// Safety layer for goal input. Runs before any plan generation.
// Crisis input never produces a plan; sensitive input produces a plan
// plus a supportive care note. Patterns are intentionally broad — a
// false positive costs a gentler experience, a false negative costs harm.

export type GuardrailResult =
  | { level: "ok" }
  | { level: "crisis" }
  | { level: "sensitive"; note: string };

const CRISIS = /suicid|kill (myself|me)|self.?harm|hurt(ing)? myself|end (it all|my life)|don.?t want to (live|be alive|exist)|better off dead/i;

const EATING = /anorexi|bulimi|purge|purging|starv(e|ing)( myself)?|barely eat|stop eating|hate eating/i;

const ADDICTION = /\baddict|quit (drinking|alcohol|smoking|vaping|weed|gambling|porn)|sober|relapse/i;

const CLINICAL = /\bdepress|\banxiety disorder\b|\bbipolar\b|\bptsd\b|\bocd\b|\badhd\b|diagnos|therapy|therapist|medication/i;

export function checkInput(input: string): GuardrailResult {
  if (CRISIS.test(input)) return { level: "crisis" };
  if (EATING.test(input)) {
    return {
      level: "sensitive",
      note: "Your relationship with food deserves real care, and an app is not the right tool for that part. This plan focuses on nourishment and kindness toward your body — and talking with a doctor, dietitian, or therapist is a strong move, not a setback.",
    };
  }
  if (ADDICTION.test(input)) {
    return {
      level: "sensitive",
      note: "Changing a dependency is one of the hardest things a person can do, and doing it with support works far better than doing it alone. This plan can help with structure and momentum — pairing it with professional or community support (a doctor, a counselor, a group) is a strength.",
    };
  }
  if (CLINICAL.test(input)) {
    return {
      level: "sensitive",
      note: "DisciplineU is a planning tool, not a clinical one — it can't diagnose or treat anything, and it won't try. The habits below are general, supportive structure. Anything medical belongs with a professional who knows you.",
    };
  }
  return { level: "ok" };
}

export const CRISIS_RESOURCES = [
  { label: "988 Suicide & Crisis Lifeline (US)", detail: "Call or text 988 — free, confidential, 24/7" },
  { label: "Crisis Text Line", detail: "Text HOME to 741741" },
  { label: "Outside the US", detail: "findahelpline.com lists free support lines by country" },
];
