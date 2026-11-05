// Presentation only: the engine has already resolved the saved option odds.
export const TENSION_MS = 500;
export const ACTION_MS = 2300;
export const RESULT_HOLD_MS = 650;

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
