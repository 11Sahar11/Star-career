/**
 * Ads through Google's H5 Games Ad Placement API (AdSense for games).
 *
 * Off until VITE_ADSENSE_CLIENT is set (for example "ca-pub-1234567890123456").
 * While off, a rewarded clip grants its reward at once and an interstitial is
 * skipped, so the game plays the same with or without ads.
 * VITE_ADSENSE_TEST=on loads Google's test ads.
 *
 * House rules (also stated on the privacy page):
 * - interstitials only between seasons (a key-match halftime slot exists but is
 *   off behind HALFTIME_INTERSTITIAL in economy.ts until the owner approves it);
 * - at most 2 interstitials per season, counted in the save;
 * - no interstitial in a player's first session or in the daily race;
 * - at least three minutes between interstitials, and none within 120s of a rewarded clip;
 * - rewarded clips are always the player's choice; no banners anywhere.
 * - suppressed (admin, or remove-ads owners): no interstitial, rewards granted without a clip.
 */

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

const CLIENT = (import.meta.env.VITE_ADSENSE_CLIENT as string | undefined)?.trim() || "";
const TEST = (import.meta.env.VITE_ADSENSE_TEST as string | undefined) === "on";
const GAP_MS = 3 * 60 * 1000;
const SESSIONS_KEY = "star-sessions";

const REWARD_COOLDOWN_MS = 120 * 1000;
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
let lastInterstitial = 0;
let firstSession = true;

export const adsEnabled = Boolean(CLIENT);

/** Loads the ad script once. Safe to call on every boot. */
export function initAds() {
  if (typeof window === "undefined") return;
  try {
    const count = Number(localStorage.getItem(SESSIONS_KEY) || "0") + 1;
    localStorage.setItem(SESSIONS_KEY, String(count));
    firstSession = count <= 1;
  } catch {
    firstSession = false;
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
  document.head.appendChild(script);
  w.adConfig?.({ preloadAdBreaks: "on", sound: "on" });
}

/** A full-screen ad at a natural break. Calls `done` whether or not an ad showed; `shown` only when one was requested. */
export function showInterstitial(name: string, done: () => void, shown?: () => void) {
  const w = typeof window === "undefined" ? null : (window as AdWindow);
  const now = Date.now();
  if (suppressed || !w?.adBreak || !CLIENT || firstSession || now - lastInterstitial < GAP_MS || now - lastRewardedAt < REWARD_COOLDOWN_MS) {
    done();
    return;
  }
  lastInterstitial = now;
  shown?.();
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
      settle(onReward);
    },
    adDismissed: () => {
      lastRewardedAt = Date.now();
      settle(onDismissed);
    },
    adBreakDone: () => settle(offered ? onDismissed : onUnavailable),
  });
}
