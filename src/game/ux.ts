import { statCap } from "./engine";
import type { AttrKey, PositionId } from "./types";

/** The shown value is on the position cap that applyTrain uses. The row then shows `mo.max`. */
export function trainingMaxLabel(position: PositionId, potential: number, value: number, key: AttrKey): "mo.max" | null {
  return value >= statCap(position, potential, key) ? "mo.max" : null;
}

/** The build screen's "+N leagues · Store" row opens the Store tab. */
export function tabFromLockedLeaguesRow(): "store" {
  return "store";
}

/**
 * A premium camp's first result stays on the training screen.
 * The reveal has to clear once that career arrives, or the second pick stays blocked.
 */
export function shouldResetTrainReveal(fromPremium: boolean, arrived: { premiumCamp: boolean; screen: string }) {
  return fromPremium && !arrived.premiumCamp && (arrived.screen === "camp" || arrived.screen === "break");
}

/**
 * Key matches keep Skip above the decision. A non-key opener pauses on the
 * first moment and moves Skip below that card instead.
 */
export function debutHidesTopSkip(debut: boolean | undefined, reveal: number | null, active: number) {
  return debut === true && (reveal === 0 || (active === 0 && reveal === null));
}
