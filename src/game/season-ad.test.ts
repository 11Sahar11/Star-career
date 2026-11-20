import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createCareer } from "./engine";
import { CAPS, SEASON_AD, countInterstitial, shouldShowSeasonAd, type SeasonAdInput } from "./economy";
import type { Career } from "./types";

const NOW = 1_800_000_000_000;

/** A career on the season summary after season `n`. */
function atSummary(n: number): Career {
  const career = createCareer("Ads", "ST", "eng", 7);
  return { ...career, screen: "season", year: 2026 + n - 1 };
}

/** Every condition met: the ad shows. Each test flips one thing. */
function input(over: Partial<SeasonAdInput> = {}): SeasonAdInput {
  return { career: atSummary(2), summaryClosed: true, adAvailable: true, removeAdsOwned: false, lastRewardedAt: 0, ...over };
}

test("season ad: shows when every rule allows it", () => {
  assert.equal(shouldShowSeasonAd(input(), NOW), true);
});

test("season ad 1: only after the player closes the season summary", () => {
  assert.equal(shouldShowSeasonAd(input({ summaryClosed: false }), NOW), false);
  // Not from any screen other than the season summary (season running, summer, offers).
  for (const screen of ["run", "summer", "offers"] as const) {
    assert.equal(shouldShowSeasonAd(input({ career: { ...atSummary(2), screen } }), NOW), false, screen);
  }
});

test("season ad 2: at most one per season transition", () => {
  assert.equal(CAPS.interstitialsPerSeason, 1);
  const shownOnce = countInterstitial(atSummary(3));
  assert.equal(shouldShowSeasonAd(input({ career: shownOnce }), NOW), false);
});

test("season ad 3: never after season 1, first possible after season 2 (by season count, not session)", () => {
  assert.equal(SEASON_AD.firstAfterSeason, 2);
  assert.equal(shouldShowSeasonAd(input({ career: atSummary(1) }), NOW), false);
  assert.equal(shouldShowSeasonAd(input({ career: atSummary(2) }), NOW), true);
  assert.equal(shouldShowSeasonAd(input({ career: atSummary(5) }), NOW), true);
});

test("season ad 4: skipped within 90s of a rewarded clip", () => {
  assert.equal(SEASON_AD.rewardCooldownMs, 90_000);
  assert.equal(shouldShowSeasonAd(input({ lastRewardedAt: NOW - 30_000 }), NOW), false);
  assert.equal(shouldShowSeasonAd(input({ lastRewardedAt: NOW - 89_999 }), NOW), false);
  assert.equal(shouldShowSeasonAd(input({ lastRewardedAt: NOW - 90_000 }), NOW), true);
  assert.equal(shouldShowSeasonAd(input({ lastRewardedAt: NOW - 10 * 60_000 }), NOW), true);
});

test("season ad 5: never for remove-ads owners", () => {
  assert.equal(shouldShowSeasonAd(input({ removeAdsOwned: true }), NOW), false);
});

test("season ad 6: no ad available means no ad (the caller moves on at once)", () => {
  assert.equal(shouldShowSeasonAd(input({ adAvailable: false }), NOW), false);
});

test("season ad: never in the daily race", () => {
  assert.equal(shouldShowSeasonAd(input({ daily: true }), NOW), false);
});

// Wiring (source checks, like PR #11's ads-policy test): ads.ts can't load under Node (Vite env).
const game = readFileSync(new URL("../components/game/GameApp.tsx", import.meta.url), "utf8");
const ads = readFileSync(new URL("./ads.ts", import.meta.url), "utf8");

test("season ad wiring: the summary button asks shouldShowSeasonAd with the remove-ads flag", () => {
  const call = game.slice(game.indexOf("onSummer={() => {"), game.indexOf('showInterstitial(\n            "season-end"'));
  assert.match(call, /shouldShowSeasonAd\(/);
  assert.match(call, /\.\.\.seasonAdContext\(\)/);
  assert.match(call, /summaryClosed: true/);
  assert.match(call, /removeAdsOwned: loadDevice\(\)\.removeAds\.owned/);
  assert.match(call, /if \(!showAd\) return update\(startSummer\(run\)\)/);
});

test("season ad wiring: no first-session rule or own cooldown left in ads.ts", () => {
  assert.doesNotMatch(ads, /firstSession/);
  assert.doesNotMatch(ads, /REWARD_COOLDOWN_MS|GAP_MS/);
  assert.match(ads, /export function seasonAdContext\(\)/);
});
