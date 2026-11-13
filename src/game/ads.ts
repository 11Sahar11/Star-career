/**
 * Ads through Google's H5 Games Ad Placement API (AdSense for games).
 *
 * Off until VITE_ADSENSE_CLIENT is set (for example "ca-pub-1234567890123456").
 * While off, a rewarded clip grants its reward at once and an interstitial is
 * skipped, so the game plays the same with or without ads.
 * VITE_ADSENSE_TEST=on loads Google's test ads.
 *
 * House rules (also stated on the privacy page):
 * - one forced interstitial per season transition, decided by the pure
 *   shouldShowSeasonAd() in economy.ts: after the player leaves the season
 *   summary, never after season 1, not within 90s of a rewarded clip, never for
 *   remove-ads owners, never in the daily race (a key-match halftime slot
 *   exists but is off behind HALFTIME_INTERSTITIAL until the owner approves it);
 * - no ad ready: the game moves on at once;
 * - rewarded clips are always the player's choice; no banners anywhere.
 * - suppressed (admin): no interstitial, rewards granted without a clip.
 */

import { track } from "./analytics";

type AdBreakPlacement = {
  type: "start" | "pause" | "next" | "browse" | "reward";
  name: string;
  beforeAd?: () => void;
  afterAd?: () => void;
  beforeReward?: (showAdFn: () => void) => void;
  adDismissed?: () => void;
  adViewed?: () => void;
  adBreakDone?: (info: { breakStatus: string }) => void;
};

type AdWindow = Window & {
  adsbygoogle?: unknown[];
  adBreak?: (placement: AdBreakPlacement) => void;
  adConfig?: (config: Record<string, unknown>) => void;
};

const ADMOB_INTERSTITIAL = (import.meta.env.VITE_ADMOB_INTERSTITIAL_SLOT as string | undefined)?.trim() || "";
const ADMOB_REWARDED = (import.meta.env.VITE_ADMOB_REWARDED_SLOT as string | undefined)?.trim() || "";
const CLIENT = (import.meta.env.VITE_ADSENSE_CLIENT as string | undefined)?.trim() || "";
const TEST = (import.meta.env.VITE_ADSENSE_TEST as string | undefined) === "on";
const SESSIONS_KEY = "star-sessions";

const REWARD_TIMEOUT_MS = 8000;

let ready = false;
let lastRewardedAt = 0;
let suppressed = false;

/** Admin play and remove-ads owners: no ads are requested at all, so nothing counts in ad stats. */
export function setAdsSuppressed(value: boolean) {
  suppressed = value;
}

export function adsSuppressed() {
  return suppressed;
}

export const adsEnabled = Boolean(CLIENT);

/** Loads the ad script once. Safe to call on every boot. */
export function initAds() {
  if (typeof window === "undefined") return;
  try {
    // Session count for analytics (no longer an ad rule).
    const count = Number(localStorage.getItem(SESSIONS_KEY) || "0") + 1;
    localStorage.setItem(SESSIONS_KEY, String(count));
  } catch {
    /* private mode */
  }
  if (!CLIENT || ready) return;
  ready = true;
  const w = window as AdWindow;
  w.adsbygoogle = w.adsbygoogle || [];
  const push = (placement: unknown) => {
    (w.adsbygoogle as unknown[]).push(placement);
  };
  w.adBreak = push as AdWindow["adBreak"];
  w.adConfig = push as AdWindow["adConfig"];
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(CLIENT)}`;
  script.setAttribute("data-ad-frequency-hint", "180s");
  if (TEST) script.setAttribute("data-adbreak-test", "on");
  if (ADMOB_INTERSTITIAL) script.setAttribute("data-admob-interstitial-slot", ADMOB_INTERSTITIAL);
  if (ADMOB_REWARDED) script.setAttribute("data-admob-rewarded-slot", ADMOB_REWARDED);
  document.head.appendChild(script);
  w.adConfig?.({ preloadAdBreaks: "on", sound: "on" });
}

/** An interstitial can be requested now: ads configured, the SDK hook is there, not suppressed. */
export function interstitialAvailable() {
  const w = typeof window === "undefined" ? null : (window as AdWindow);
  return !suppressed && Boolean(CLIENT) && Boolean(w?.adBreak);
}

/**
 * What shouldShowSeasonAd (economy.ts) needs from the ad layer. PR #11's AdMob
 * ads.ts can provide the same shape: adAvailable = adsEnabled() && !adsBlocked(),
 * lastRewardedAt = its module-level lastRewardedAt.
 */
export function seasonAdContext(): { adAvailable: boolean; lastRewardedAt: number } {
  return { adAvailable: interstitialAvailable(), lastRewardedAt };
}

/**
 * A full-screen ad at a natural break. Frequency rules live in the caller
 * (shouldShowSeasonAd). Calls `done` whether or not an ad showed — at once when
 * no ad can be requested; `shown` only when one was requested.
 */
export function showInterstitial(name: string, done: () => void, shown?: () => void) {
  const w = typeof window === "undefined" ? null : (window as AdWindow);
  if (!interstitialAvailable() || !w?.adBreak) {
    done();
    return;
  }
  shown?.();
  track("interstitial_shown", { placement: name });
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    done();
  };
  w.adBreak({ type: "next", name, adBreakDone: finish });
  // The API calls adBreakDone even when no ad is available; this is a safety net.
  window.setTimeout(finish, 4000);
}

/**
 * A rewarded clip the player chose. `onReward` runs only when the clip was
 * watched; with ads off or suppressed it runs at once. `onUnavailable` runs when
 * no clip could be shown (also after 8s with no answer), `onDismissed` when the
 * player closed it early. Neither consumes a cap: the caller only counts on reward.
 */
export function showRewarded(name: string, onReward: () => void, onUnavailable?: () => void, onDismissed?: () => void) {
  const w = typeof window === "undefined" ? null : (window as AdWindow);
  if (suppressed || !CLIENT || !w?.adBreak) {
    onReward();
    return;
  }
  let settled = false;
  let offered = false;
  const settle = (fn?: () => void) => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timer);
    fn?.();
  };
  const timer = window.setTimeout(() => {
    if (!offered) settle(onUnavailable);
  }, REWARD_TIMEOUT_MS);
  w.adBreak({
    type: "reward",
    name,
    beforeReward: (showAdFn) => {
      offered = true;
      showAdFn();
    },
    adViewed: () => {
      lastRewardedAt = Date.now();
      track("rewarded_watched", { placement: name });
      settle(onReward);
    },
    adDismissed: () => {
      lastRewardedAt = Date.now();
      settle(onDismissed);
    },
    adBreakDone: () => settle(offered ? onDismissed : onUnavailable),
  });
}
