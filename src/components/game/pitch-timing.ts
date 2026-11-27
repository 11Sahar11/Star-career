// Presentation only: the engine has already resolved the saved option odds.
export const TENSION_MS = 300;
export const ACTION_MS = 1500;
export const RESULT_HOLD_MS = 400;
/** How long the result overlay stays on the board before the next decision. */
export const RESULT_OVERLAY_MS = 1200;

export type ResultCardMode = "auto" | "retry" | "finish";

/** A failed moment with a retry stays on the card; the last moment keeps the finish button. */
export function resultCardMode(isLast: boolean, canRetry: boolean): ResultCardMode {
  if (canRetry) return "retry";
  if (isLast) return "finish";
  return "auto";
}

export function pitchFrame(elapsed: number, reducedMotion = false) {
  if (reducedMotion) return { progress: 1, tension: false, zoom: 1 };
  const progress = Math.max(0, Math.min(1, (elapsed - TENSION_MS) / ACTION_MS));
  const beat = Math.max(0, Math.min(1, elapsed / TENSION_MS));
  const settle = Math.max(0, (progress - 0.8) / 0.2);
  const smooth = (x: number) => x * x * (3 - 2 * x);
  return {
    progress,
    tension: elapsed < TENSION_MS,
    zoom: 1 + 0.045 * smooth(beat) * (1 - smooth(settle)),
  };
}
