import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { HALFTIME_INTERSTITIAL } from "./economy.ts";

const root = new URL("../../", import.meta.url);

test("the interstitial hook does not encode the season frequency cap", () => {
  const game = readFileSync(new URL("../components/game/GameApp.tsx", import.meta.url), "utf8");
  const calls = [...game.matchAll(/showInterstitial\(/g)];
  assert.equal(calls.length, 1);
  assert.equal(HALFTIME_INTERSTITIAL, false);
  const ads = readFileSync(new URL("./ads.ts", import.meta.url), "utf8");
  assert.doesNotMatch(ads, /REWARD_COOLDOWN|90 \* 1000|90000|interstitialsPerSeason|season 1/);
  assert.match(ads, /export function showInterstitial\(done: \(\) => void/);
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
