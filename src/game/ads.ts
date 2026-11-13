/**
 * Ads for the Android app, through AdMob (Capacitor). The browser build never
 * requests an ad: a rewarded clip grants its reward at once and an interstitial
 * is skipped.
 *
 * Owner rules:
 * - exactly one forced placement, the season-end interstitial (`season-end`);
 * - any other name is ignored, so a match, halftime, or menu cannot force an ad;
 * - rewarded clips only when the player asks for one;
 * - no banners;
 * - the device remove-ads flag and debug-admin suppression skip the interstitial
 *   and grant rewards without a clip;
 * - ages 13+: max content rating Teen (T / PG-13). Child-directed treatment is
 *   not set (the request is not tagged for children);
 * - unit ids are Google's official TEST ids while `app.config.json` says testOnly.
 */

import { Capacitor } from "@capacitor/core";
import appConfig from "../../app.config.json" with { type: "json" };
import { track } from "./analytics";
import { kvGet, kvSet } from "./kv";

const SESSIONS_KEY = "star-sessions";
const ECONOMY_KEY = "star-economy-v1";
export const SEASON_END_PLACEMENT = "season-end";

/** Google's published sample units. Used whenever testOnly is set. */
export const GOOGLE_TEST_ADS = {
  androidAppId: "ca-app-pub-3940256099942544~3347511713",
  interstitial: "ca-app-pub-3940256099942544/1033173712",
  rewarded: "ca-app-pub-3940256099942544/5224354917",
} as const;

const REWARD_COOLDOWN_MS = 120 * 1000;

let starting: Promise<boolean> | null = null;
let lastRewardedAt = 0;
let suppressed = false;

type AdMobModule = typeof import("@capacitor-community/admob");

/** True only inside the native app, where an ad can actually play. */
export function adsEnabled() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function resolvedAdUnitIds() {
  if (appConfig.ads.testOnly) return GOOGLE_TEST_ADS;
  return {
    androidAppId: appConfig.ads.androidAppId,
    interstitial: appConfig.ads.interstitial,
    rewarded: appConfig.ads.rewarded,
  };
}

/** Admin play: nothing is requested, and rewards are granted without a clip. */
export function setAdsSuppressed(value: boolean) {
  suppressed = value;
}

export function adsSuppressed() {
  return suppressed;
}

function removeAdsOwned() {
  try {
    const raw = kvGet(ECONOMY_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as { removeAds?: { owned?: boolean } };
    return data.removeAds?.owned === true;
  } catch {
    return false;
  }
}

function adsBlocked() {
  return suppressed || removeAdsOwned();
}

/** Loads the session counter and, on Android only, initializes AdMob. */
export function initAds() {
  if (typeof window === "undefined") return;
  try {
    const count = Number(kvGet(SESSIONS_KEY) || "0") + 1;
    kvSet(SESSIONS_KEY, String(count));
  } catch {
    /* ignore */
  }
  if (adsEnabled()) void ensureAds();
}

async function ensureAds(): Promise<AdMobModule | null> {
  if (!adsEnabled() || adsBlocked()) return null;
  if (!starting) {
    starting = (async () => {
      const admob = await import("@capacitor-community/admob");
      await admob.AdMob.initialize({
        initializeForTesting: appConfig.ads.testOnly,
        maxAdContentRating: admob.MaxAdContentRating.Teen,
      });
      return true;
    })().catch(() => false);
  }
  const ok = await starting;
  if (!ok) return null;
  return import("@capacitor-community/admob");
}

function settleOnce(run: () => void) {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    run();
  };
}

/**
 * The one forced ad, after a season. `done` always runs, after the ad closes
 * when one was shown. `shown` runs only when an interstitial was presented.
 * Any placement other than season-end is ignored.
 */
export function showInterstitial(name: string, done: () => void, shown?: () => void) {
  const finish = settleOnce(done);
  if (name !== SEASON_END_PLACEMENT || !adsEnabled() || adsBlocked() || Date.now() - lastRewardedAt < REWARD_COOLDOWN_MS) {
    finish();
    return;
  }
  void (async () => {
    try {
      const admob = await ensureAds();
      if (!admob) return;
      const ids = resolvedAdUnitIds();
      let closed = false;
      const untilClosed = new Promise<void>((resolve) => {
        const end = () => {
          if (closed) return;
          closed = true;
          resolve();
        };
        void admob.AdMob.addListener(admob.InterstitialAdPluginEvents.Dismissed, end);
        void admob.AdMob.addListener(admob.InterstitialAdPluginEvents.FailedToShow, end);
      });
      await admob.AdMob.prepareInterstitial({ adId: ids.interstitial, isTesting: appConfig.ads.testOnly });
      shown?.();
      track("interstitial_shown", { placement: name });
      await admob.AdMob.showInterstitial();
      await untilClosed;
    } catch {
      /* no fill — the season still continues */
    } finally {
      finish();
    }
  })();
}

/**
 * A rewarded clip the player chose. `onReward` runs only when the clip was
 * watched; with ads off, suppressed, or remove-ads it runs at once.
 * `onUnavailable` when no clip could be shown, `onDismissed` when it was closed early.
 */
export function showRewarded(name: string, onReward: () => void, onUnavailable?: () => void, onDismissed?: () => void) {
  if (!adsEnabled() || adsBlocked()) {
    onReward();
    return;
  }
  void (async () => {
    try {
      const admob = await ensureAds();
      if (!admob) {
        onUnavailable?.();
        return;
      }
      const ids = resolvedAdUnitIds();
      let rewarded = false;
      let end = () => {};
      const untilClosed = new Promise<void>((resolve) => {
        let closed = false;
        end = () => {
          if (closed) return;
          closed = true;
          resolve();
        };
        void admob.AdMob.addListener(admob.RewardAdPluginEvents.Rewarded, () => {
          rewarded = true;
        });
        void admob.AdMob.addListener(admob.RewardAdPluginEvents.Dismissed, end);
        void admob.AdMob.addListener(admob.RewardAdPluginEvents.FailedToShow, end);
      });
      await admob.AdMob.prepareRewardVideoAd({ adId: ids.rewarded, isTesting: appConfig.ads.testOnly });
      void admob.AdMob.showRewardVideoAd().catch(() => end());
      await untilClosed;
      lastRewardedAt = Date.now();
      if (rewarded) {
        track("rewarded_watched", { placement: name });
        onReward();
      } else onDismissed?.();
    } catch {
      onUnavailable?.();
    }
  })();
}
