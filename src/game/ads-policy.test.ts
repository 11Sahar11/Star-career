import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { HALFTIME_INTERSTITIAL } from "./economy.ts";
import { applyRewardAdEvent, rewardedAdReady, showInterstitial, showRewarded } from "./ads.ts";

const root = new URL("../../", import.meta.url);

test("the interstitial hook does not encode the season frequency cap", () => {
  const game = readFileSync(new URL("../components/game/GameApp.tsx", import.meta.url), "utf8");
  const names = [...game.matchAll(/showInterstitial\(\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(names, ["season-end"]);
  assert.equal(HALFTIME_INTERSTITIAL, false);
  assert.doesNotMatch(game, /canShowSeasonInterstitial|keymatch-half/);
  const call = game.slice(game.indexOf("onSummer={() => {"), game.indexOf('showInterstitial(\n            "season-end"'));
  assert.match(call, /shouldShowSeasonAd\(/);
  assert.match(call, /\.\.\.seasonAdContext\(\)/);
  assert.match(call, /summaryClosed: true/);
  assert.match(call, /removeAdsOwned: loadDevice\(\)\.removeAds\.owned/);
  assert.match(call, /if \(!showAd\) return update\(startSummer\(run\)\)/);
  const ads = readFileSync(new URL("./ads.ts", import.meta.url), "utf8");
  assert.doesNotMatch(ads, /REWARD_COOLDOWN|90 \* 1000|90000|interstitialsPerSeason|canShowSeasonInterstitial/);
  assert.match(ads, /export function showInterstitial\(name: string, done: \(\) => void/);
  assert.match(ads, /export function seasonAdContext\(\)/);
  assert.match(ads, /enabled = adsEnabled\(\) && !adsBlocked\(\)/);
  assert.match(ads, /removeAdsOwned/);
  assert.match(ads, /prepareInterstitial/);
  assert.match(ads, /prepareRewardVideoAd/);
});

test("AdMob stays on Google test units, asks for UMP consent, and is not child-directed", () => {
  const config = JSON.parse(readFileSync(new URL("app.config.json", root), "utf8")) as {
    appId: string;
    ads: {
      testOnly: boolean;
      maxAdContentRating: string;
      androidAppId: string;
      interstitial: string;
      rewarded: string;
      umpTestDeviceIds: string[];
    };
  };
  assert.equal(config.appId, "com.starcareer.game");
  assert.equal(config.ads.testOnly, true);
  assert.equal(config.ads.maxAdContentRating, "T");
  assert.equal(config.ads.androidAppId, "ca-app-pub-3940256099942544~3347511713");
  assert.equal(config.ads.interstitial, "ca-app-pub-3940256099942544/1033173712");
  assert.equal(config.ads.rewarded, "ca-app-pub-3940256099942544/5224354917");
  assert.deepEqual(config.ads.umpTestDeviceIds, []);
  const capacitor = JSON.parse(readFileSync(new URL("capacitor.config.json", root), "utf8")) as { appId: string; server?: { url?: string } };
  assert.equal(capacitor.appId, config.appId);
  assert.equal(capacitor.server, undefined);

  const ads = readFileSync(new URL("./ads.ts", import.meta.url), "utf8");
  assert.match(ads, /MaxAdContentRating\.Teen/);
  assert.match(ads, /requestConsentInfo/);
  assert.match(ads, /AdmobConsentDebugGeography\.EEA/);
  assert.match(ads, /tagForUnderAgeOfConsent/);
  assert.ok(ads.indexOf("requestConsentInfo") < ads.indexOf("AdMob.initialize"));
  assert.doesNotMatch(ads, /tagForChildDirectedTreatment/);
  assert.doesNotMatch(ads, /pagead2\.googlesyndication/);
  assert.doesNotMatch(ads, /immersiveMode/);
});

test("the release build cannot turn admin perks on", () => {
  const flag = readFileSync(new URL("./debug-admin.ts", import.meta.url), "utf8");
  assert.match(flag, /import\.meta\.env\.MODE !== "production"/);
});

test("a rewarded clip pays only on Rewarded, and an early close only stamps the cooldown", () => {
  const none = { grant: false, lastRewardedAt: 0 };
  const closed = applyRewardAdEvent("dismissed", none, 5000);
  assert.equal(closed.grant, false);
  assert.equal(closed.lastRewardedAt, 5000);
  const watched = applyRewardAdEvent("rewarded", none, 8000);
  assert.equal(watched.grant, true);
  assert.equal(watched.lastRewardedAt, 8000);
  const thenClosed = applyRewardAdEvent("dismissed", watched, 9000);
  assert.equal(thenClosed.grant, true);
  assert.equal(thenClosed.lastRewardedAt, 9000);
  const failed = applyRewardAdEvent("failed", none, 1000);
  assert.equal(failed.grant, false);
  assert.equal(failed.lastRewardedAt, 0);
  const ads = readFileSync(new URL("./ads.ts", import.meta.url), "utf8");
  assert.match(ads, /applyRewardAdEvent\(event/);
  assert.match(ads, /handle\.remove\(\)/);
  assert.match(ads, /DISMISS_TIMEOUT_MS/);
  assert.match(ads, /outcome === "retry"/);
  assert.match(ads, /starting = null/);
});

test("showRewarded does not pay the daily chest, coin double, or heal when no clip is ready", () => {
  let granted = 0;
  let unavailable = 0;
  for (const name of ["daily-chest", "double-coins", "heal"]) {
    showRewarded(
      name,
      () => {
        granted += 1;
      },
      () => {
        unavailable += 1;
      },
    );
  }
  assert.equal(granted, 0);
  assert.equal(unavailable, 3);
  assert.equal(rewardedAdReady(), false);
  const game = readFileSync(new URL("../components/game/GameApp.tsx", import.meta.url), "utf8");
  const chest = game.slice(game.indexOf("function DailyChest"), game.indexOf("function Create"));
  assert.match(chest, /rewardedAdReady\(\)/);
  assert.match(chest, /videoReady \?/);
  assert.match(chest, /onReward=\{\(\) => open\(true\)\}/);
  assert.match(chest, /onClick=\{\(\) => open\(false\)\}/);
  const boot = game.slice(game.indexOf("initAds();"), game.indexOf("if (!admin) trackDailyOpen"));
  assert.match(boot, /prepareAds\(\)/);
  assert.doesNotMatch(boot, /removeAds/);
});

test("showInterstitial continues immediately when AdMob is not ready or the placement is not season-end", () => {
  let continued = 0;
  showInterstitial("season-end", () => {
    continued += 1;
  });
  showInterstitial("keymatch-half", () => {
    continued += 1;
  });
  assert.equal(continued, 2);
});
