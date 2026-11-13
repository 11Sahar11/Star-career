/**
 * Ads for the Android app, through AdMob (Capacitor). The browser build never
 * requests an ad: a rewarded clip grants its reward at once and an interstitial
 * is skipped.
 *
 * This file loads ads. It does not decide how often a season interstitial
 * may play. That belongs to the caller. `showInterstitial` only presents a
 * preloaded full-screen ad and waits until AdMob's own close button dismisses it.
 *
 * Before the first request: Google UMP consent (EEA/UK form). Test builds
 * force UMP debug geography to EEA so that form can be tried. Players who say
 * they are under 16 are tagged tagForUnderAgeOfConsent. Child-directed
 * treatment is never set. Max content rating is Teen. Unit ids are Google's
 * official TEST ids while `app.config.json` says testOnly.
 */

import { Capacitor } from "@capacitor/core";
import appConfig from "../../app.config.json" with { type: "json" };
import { track } from "./analytics";
import { kvGet, kvSet } from "./kv";

const SESSIONS_KEY = "star-sessions";
const ECONOMY_KEY = "star-economy-v1";
const AD_AGE_KEY = "star-ad-age";

/** Google's published sample units. Used whenever testOnly is set. */
export const GOOGLE_TEST_ADS = {
  androidAppId: "ca-app-pub-3940256099942544~3347511713",
  interstitial: "ca-app-pub-3940256099942544/1033173712",
  rewarded: "ca-app-pub-3940256099942544/5224354917",
} as const;

export type AdAge = "under" | "16plus";

let starting: Promise<boolean> | null = null;
let suppressed = false;
let privacyOptionsRequired = false;

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

export function adAge(): AdAge | null {
  const raw = kvGet(AD_AGE_KEY);
  return raw === "under" || raw === "16plus" ? raw : null;
}

/** Saves the age answer, then runs consent and preloads. No ad request happens before this. */
export function setAdAge(value: AdAge): Promise<void> {
  kvSet(AD_AGE_KEY, value);
  starting = null;
  return prepareAds();
}

export function adPrivacyOptionsRequired() {
  return privacyOptionsRequired;
}

export function openAdPrivacyOptions(): Promise<void> {
  if (!adsEnabled()) return Promise.resolve();
  return import("@capacitor-community/admob").then(({ AdMob }) => AdMob.showPrivacyOptionsForm());
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

/** Session counter only. Consent starts once an age answer is saved. */
export function initAds() {
  if (typeof window === "undefined") return;
  try {
    const count = Number(kvGet(SESSIONS_KEY) || "0") + 1;
    kvSet(SESSIONS_KEY, String(count));
  } catch {
    /* ignore */
  }
}

/** UMP consent, then AdMob init, then preload. Safe to call more than once. */
export function prepareAds(): Promise<void> {
  return ensureAds().then(() => undefined);
}

async function preload(admob: AdMobModule) {
  const ids = resolvedAdUnitIds();
  const isTesting = appConfig.ads.testOnly;
  await Promise.allSettled([
    admob.AdMob.prepareInterstitial({ adId: ids.interstitial, isTesting }),
    admob.AdMob.prepareRewardVideoAd({ adId: ids.rewarded, isTesting }),
  ]);
}

async function ensureAds(): Promise<AdMobModule | null> {
  if (!adsEnabled() || adsBlocked()) return null;
  const age = adAge();
  if (!age) return null;
  if (!starting) {
    starting = (async () => {
      const admob = await import("@capacitor-community/admob");
      const underAge = age === "under";
      const request: import("@capacitor-community/admob").AdmobConsentRequestOptions = {};
      if (underAge) request.tagForUnderAgeOfConsent = true;
      if (appConfig.ads.testOnly) {
        // EEA debug geography exercises the GDPR form used for the EEA and the UK.
        request.debugGeography = admob.AdmobConsentDebugGeography.EEA;
        const devices = appConfig.ads.umpTestDeviceIds ?? [];
        if (devices.length) request.testDeviceIdentifiers = devices;
      }
      let info = await admob.AdMob.requestConsentInfo(request);
      if (!underAge && info.isConsentFormAvailable && info.status === admob.AdmobConsentStatus.REQUIRED) {
        info = await admob.AdMob.showConsentForm();
      }
      privacyOptionsRequired = String(info.privacyOptionsRequirementStatus) === "REQUIRED";
      if (!info.canRequestAds) return false;
      await admob.AdMob.initialize({
        initializeForTesting: appConfig.ads.testOnly,
        maxAdContentRating: admob.MaxAdContentRating.Teen,
        ...(underAge ? { tagForUnderAgeOfConsent: true } : {}),
      });
      await preload(admob);
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
 * Presents the preloaded interstitial. `done` runs when AdMob's close button
 * dismisses it, or immediately when no ad can be shown. `shown` runs only when
 * one was presented. Does not apply a frequency cap.
 */
export function showInterstitial(done: () => void, shown?: () => void) {
  const finish = settleOnce(done);
  if (!adsEnabled() || adsBlocked()) {
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
      try {
        await admob.AdMob.showInterstitial();
      } catch {
        await admob.AdMob.prepareInterstitial({ adId: ids.interstitial, isTesting: appConfig.ads.testOnly });
        await admob.AdMob.showInterstitial();
      }
      shown?.();
      track("interstitial_shown", { placement: "interstitial" });
      await untilClosed;
      void preload(admob);
    } catch {
      /* no fill */
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
      const play = () => {
        void admob.AdMob.showRewardVideoAd().catch(async () => {
          try {
            await admob.AdMob.prepareRewardVideoAd({ adId: ids.rewarded, isTesting: appConfig.ads.testOnly });
            void admob.AdMob.showRewardVideoAd().catch(() => end());
          } catch {
            end();
          }
        });
      };
      play();
      await untilClosed;
      void preload(admob);
      if (rewarded) {
        track("rewarded_watched", { placement: name });
        onReward();
      } else onDismissed?.();
    } catch {
      onUnavailable?.();
    }
  })();
}
