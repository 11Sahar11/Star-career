import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { HALFTIME_INTERSTITIAL, CAPS } from "./economy.ts";

const root = new URL("../../", import.meta.url);

test("the only forced ad call is the season-end interstitial", () => {
  const game = readFileSync(new URL("../components/game/GameApp.tsx", import.meta.url), "utf8");
  const names = [...game.matchAll(/showInterstitial\(\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(names, ["season-end"]);
  assert.equal(HALFTIME_INTERSTITIAL, false);
  assert.equal(CAPS.interstitialsPerSeason, 1);
});

test("AdMob stays on Google test units, teen rating, and not child-directed", () => {
  const config = JSON.parse(readFileSync(new URL("app.config.json", root), "utf8")) as {
    appId: string;
    ads: { testOnly: boolean; maxAdContentRating: string; androidAppId: string; interstitial: string; rewarded: string };
  };
  assert.equal(config.appId, "com.starcareer.game");
  assert.equal(config.ads.testOnly, true);
  assert.equal(config.ads.maxAdContentRating, "T");
  assert.equal(config.ads.androidAppId, "ca-app-pub-3940256099942544~3347511713");
  assert.equal(config.ads.interstitial, "ca-app-pub-3940256099942544/1033173712");
  assert.equal(config.ads.rewarded, "ca-app-pub-3940256099942544/5224354917");
  const capacitor = JSON.parse(readFileSync(new URL("capacitor.config.json", root), "utf8")) as { appId: string; server?: { url?: string } };
  assert.equal(capacitor.appId, config.appId);
  assert.equal(capacitor.server, undefined);

  const ads = readFileSync(new URL("./ads.ts", import.meta.url), "utf8");
  assert.match(ads, /MaxAdContentRating\.Teen/);
  assert.doesNotMatch(ads, /tagForChildDirectedTreatment/);
  assert.doesNotMatch(ads, /pagead2\.googlesyndication/);
  assert.doesNotMatch(ads, /tagForUnderAgeOfConsent:\s*true/);
});

test("the release build cannot turn admin perks on", () => {
  const flag = readFileSync(new URL("./debug-admin.ts", import.meta.url), "utf8");
  assert.match(flag, /import\.meta\.env\.MODE !== "production"/);
});
