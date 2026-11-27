/** Auto-sim delay per fixture at 1x. A full no-decision stretch must stay within 10s. */
export const AUTO_STEP_MS = 180;

export const MAX_WATCH_MS = 10_000;

export function watchStretchMs(fixtures: number, speed = 1) {
  return Math.ceil((fixtures * AUTO_STEP_MS) / speed);
}
