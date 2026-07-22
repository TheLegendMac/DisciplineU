// Subtle tactile feedback. navigator.vibrate is supported on Android Chrome;
// iOS Safari ignores it, so this is a harmless no-op there. We stay quiet when
// the user has asked for reduced motion.
export function haptic(kind: "tap" | "complete" = "tap"): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  navigator.vibrate(kind === "complete" ? [10, 28, 12] : 8);
}
