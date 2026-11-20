/**
 * Ads for the Android app, through AdMob (Capacitor). The browser build never
 * requests an ad. A rewarded clip pays only after AdMob's Rewarded event, so
 * with no ad client the reward is not granted. An interstitial is skipped.
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

let starting: Promise<boolean | "retry"> | null = null;
let suppressed = false;
let privacyOptionsRequired = false;
let lastRewardedAt = 0;
let interstitialReady = false;
let rewardedReady = false;
const rewardedListeners = new Set<() => void>();

type ListenerHandle = { remove: () => Promise<void> };

/** A full-screen ad the player does not close should not freeze the season. */
const DISMISS_TIMEOUT_MS = 60_000;

function markRewardedReady(value: boolean) {
  rewardedReady = value;
  for (const listener of rewardedListeners) listener();
}

async function removeListeners(handles: ListenerHandle[]) {
  await Promise.all(handles.map((handle) => handle.remove().catch(() => undefined)));
}

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

/** Admin play: no ad is requested, and a missing clip does not invent a reward. */
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

/** Forced placements only. A remove-ads purchase does not block an optional rewarded clip. */
function adsBlocked() {
  return suppressed || removeAdsOwned();
}

/** True when a rewarded clip can play right now. Remove-ads does not turn this off. */
export function rewardedAdReady() {
  return adsEnabled() && !suppressed && rewardedReady;
}

export function subscribeRewardedAd(listener: () => void) {
  rewardedListeners.add(listener);
  return () => {
    rewardedListeners.delete(listener);
  };
}

/**
 * A reward is paid only for AdMob's Rewarded event. Dismissed (early close)
 * stamps the season-ad cooldown and does not pay. FailedToShow does neither.
 */
export function applyRewardAdEvent(
  event: "rewarded" | "dismissed" | "failed",
  state: { grant: boolean; lastRewardedAt: number },
  now: number,
): { grant: boolean; lastRewardedAt: number } {
  if (event === "rewarded") return { grant: true, lastRewardedAt: now };
  if (event === "dismissed") return { grant: state.grant, lastRewardedAt: now };
  return state;
}

/** What `shouldShowSeasonAd` reads from this layer. Frequency rules stay in economy.ts. */
export function seasonAdContext(): { enabled: boolean; adAvailable: boolean; lastRewardedAt: number } {
  const enabled = adsEnabled() && !adsBlocked();
  return { enabled, adAvailable: enabled, lastRewardedAt };
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
  const [interstitial, rewarded] = await Promise.allSettled([
    admob.AdMob.prepareInterstitial({ adId: ids.interstitial, isTesting }),
    admob.AdMob.prepareRewardVideoAd({ adId: ids.rewarded, isTesting }),
  ]);
  interstitialReady = interstitial.status === "fulfilled";
  markRewardedReady(rewarded.status === "fulfilled");
}

async function ensureAds(): Promise<AdMobModule | null> {
  if (!adsEnabled() || suppressed) return null;
  const age = adAge();
  if (!age) return null;
  if (!starting) {
    starting = (async () => {
      try {
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
      } catch {
        // Offline or a failed init must not stick for the whole session.
        return "retry" as const;
      }
    })();
  }
  const outcome = await starting;
  if (outcome === "retry") {
    starting = null;
    return null;
  }
  if (!outcome) return null;
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
 * Presents the preloaded season-end interstitial. Any other name is ignored.
 * `done` runs when AdMob's close button dismisses a shown ad, or immediately
 * when the ad is not ready, times out, or fails. No spinner and no wait in
 * those cases. Frequency rules stay in `shouldShowSeasonAd`.
 */
export function showInterstitial(name: string, done: () => void, shown?: () => void) {
  const finish = settleOnce(done);
  if (name !== "season-end" || !interstitialReady || !adsEnabled() || adsBlocked()) {
    finish();
    return;
  }
  interstitialReady = false;
  void (async () => {
    const handles: ListenerHandle[] = [];
    let presented = false;
    try {
      const admob = await import("@capacitor-community/admob");
      let closed = false;
      let end = () => {};
      const untilClosed = new Promise<void>((resolve) => {
        end = () => {
          if (closed) return;
          closed = true;
          resolve();
        };
      });
      handles.push(
        ...(await Promise.all([
          admob.AdMob.addListener(admob.InterstitialAdPluginEvents.Dismissed, end),
          admob.AdMob.addListener(admob.InterstitialAdPluginEvents.FailedToShow, end),
        ])),
      );
      await Promise.race([
        admob.AdMob.showInterstitial(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("timeout")), 2000);
        }),
      ]);
      presented = true;
      shown?.();
      track("interstitial_shown", { placement: name });
      await Promise.race([
        untilClosed,
        new Promise<void>((resolve) => {
          setTimeout(resolve, DISMISS_TIMEOUT_MS);
        }),
      ]);
      void preload(admob);
    } catch {
      if (!presented) finish();
    } finally {
      await removeListeners(handles);
      finish();
    }
  })();
}

/**
 * A rewarded clip the player chose. `onReward` runs only after AdMob's
 * Rewarded event. No client, a clip that is not ready, or an early close
 * does not pay. `onUnavailable` when no clip could be shown, `onDismissed`
 * when it was closed early. Remove-ads owners can still watch one.
 */
export function showRewarded(name: string, onReward: () => void, onUnavailable?: () => void, onDismissed?: () => void) {
  if (!adsEnabled() || suppressed || !rewardedReady) {
    onUnavailable?.();
    return;
  }
  void (async () => {
    const handles: ListenerHandle[] = [];
    try {
      const admob = await ensureAds();
      if (!admob) {
        onUnavailable?.();
        return;
      }
      let rewarded = false;
      let end = () => {};
      const untilClosed = new Promise<void>((resolve) => {
        let closed = false;
        end = () => {
          if (closed) return;
          closed = true;
          resolve();
        };
      });
      const stamp = (event: "rewarded" | "dismissed" | "failed") => {
        const next = applyRewardAdEvent(event, { grant: rewarded, lastRewardedAt }, Date.now());
        rewarded = next.grant;
        lastRewardedAt = next.lastRewardedAt;
      };
      handles.push(
        ...(await Promise.all([
          admob.AdMob.addListener(admob.RewardAdPluginEvents.Rewarded, () => stamp("rewarded")),
          admob.AdMob.addListener(admob.RewardAdPluginEvents.Dismissed, () => {
            stamp("dismissed");
            end();
          }),
          admob.AdMob.addListener(admob.RewardAdPluginEvents.FailedToShow, () => {
            stamp("failed");
            end();
          }),
        ])),
      );
      markRewardedReady(false);
      void Promise.race([
        admob.AdMob.showRewardVideoAd(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("timeout")), 2000);
        }),
      ]).catch(() => {
        end();
        void preload(admob);
      });
      await Promise.race([
        untilClosed,
        new Promise<void>((resolve) => {
          setTimeout(resolve, DISMISS_TIMEOUT_MS);
        }),
      ]);
      void preload(admob);
      if (rewarded) {
        track("rewarded_watched", { placement: name });
        onReward();
      } else onDismissed?.();
    } catch {
      onUnavailable?.();
    } finally {
      await removeListeners(handles);
    }
  })();
}
