/**
 * Ads through Google's H5 Games Ad Placement API (AdSense for games).
 *
 * Off until VITE_ADSENSE_CLIENT is set (for example "ca-pub-1234567890123456").
 * While off, a rewarded clip grants its reward at once and an interstitial is
 * skipped, so the game plays the same with or without ads.
 * VITE_ADSENSE_TEST=on loads Google's test ads.
 *
 * House rules (also stated on the privacy page):
 * - never during a match;
 * - no interstitial in a player's first session;
 * - at most one interstitial every three minutes;
 * - rewarded clips are always the player's choice.
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

let ready = false;
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

/** A full-screen ad at a natural break. Calls `done` whether or not an ad showed. */
export function showInterstitial(name: string, done: () => void) {
  const w = typeof window === "undefined" ? null : (window as AdWindow);
  const now = Date.now();
  if (!w?.adBreak || !CLIENT || firstSession || now - lastInterstitial < GAP_MS) {
    done();
    return;
  }
  lastInterstitial = now;
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
 * watched; with ads off it runs at once. `onUnavailable` runs when no clip
 * could be shown, so the button can say so.
 */
export function showRewarded(name: string, onReward: () => void, onUnavailable?: () => void) {
  const w = typeof window === "undefined" ? null : (window as AdWindow);
  if (!CLIENT || !w?.adBreak) {
    onReward();
    return;
  }
  let offered = false;
  w.adBreak({
    type: "reward",
    name,
    beforeReward: (showAdFn) => {
      offered = true;
      showAdFn();
    },
    adViewed: onReward,
    adDismissed: () => undefined,
    adBreakDone: () => {
      if (!offered) onUnavailable?.();
    },
  });
}
