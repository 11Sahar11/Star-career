/**
 * Product analytics through Vercel Web Analytics (cookieless, no personal data).
 *
 * The script is added in __root.tsx for production builds only. Page views are
 * counted automatically; the events below need custom events enabled on the
 * Vercel project. Before the script loads, events wait in the `vaq` queue.
 *
 * Retention without user IDs: `app_open` fires once per calendar day with
 * `day` = days since this device first opened the game. D1 ~= opens with day 1
 * / opens with day 0 over the same install dates; D7 and D30 the same way.
 *
 * Admin play is not counted (setAnalyticsSuppressed).
 */

import { kvGet, kvSet } from "./kv";

type Value = string | number | boolean | null;
type VaWindow = Window & { va?: (event: "event", payload: { name: string; data?: Record<string, Value> }) => void };

const FIRST_OPEN_KEY = "star-first-open";
const LAST_OPEN_KEY = "star-last-open";
/** Written by initAds() in ads.ts on every boot. */
const SESSIONS_KEY = "star-sessions";

let suppressed = false;

export function setAnalyticsSuppressed(value: boolean) {
  suppressed = value;
}

export type AnalyticsEvent =
  | "app_open"
  | "career_start"
  | "season_end"
  | "career_end"
  | "daily_start"
  | "daily_season"
  | "daily_finish"
  | "daily_share"
  | "streak_freeze_used"
  | "streak_milestone"
  | "rewarded_watched"
  | "interstitial_shown";

export function track(name: AnalyticsEvent, data?: Record<string, Value>) {
  if (suppressed || typeof window === "undefined") return;
  try {
    (window as VaWindow).va?.("event", data ? { name, data } : { name });
  } catch {
    /* analytics must never break the game */
  }
}

function localDay(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function daysBetween(fromKey: string, to = new Date()) {
  const [y, m, d] = fromKey.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const from = new Date(y, m - 1, d);
  const today = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.max(0, Math.round((today.getTime() - from.getTime()) / 86400000));
}

/** Once per calendar day: `app_open` with the device's day number since first open. */
export function trackDailyOpen() {
  if (typeof window === "undefined") return;
  try {
    const today = localDay();
    let first = kvGet(FIRST_OPEN_KEY);
    if (!first) {
      first = today;
      kvSet(FIRST_OPEN_KEY, first);
    }
    if (kvGet(LAST_OPEN_KEY) === today) return;
    kvSet(LAST_OPEN_KEY, today);
    track("app_open", { day: daysBetween(first), sessions: Number(kvGet(SESSIONS_KEY) || "0") });
  } catch {
    /* ignore */
  }
}
