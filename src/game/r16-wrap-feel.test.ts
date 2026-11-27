import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  answerBreak,
  answerCamp,
  buildOffers,
  commitSeason,
  createCareer,
  nextFixture,
  overall,
  afterReport,
  playStep,
  prepareSeasonWrap,
  runToStop,
  skipBigMatch,
} from "./engine";
import { ACHIEVEMENTS, checkAchievements, loadUnlocked } from "./achievements";
import { rewardedAdReady } from "./ads";
import { t, type Lang } from "./i18n";
import { kvRemove, kvSet } from "./kv";
import { AUTO_STEP_MS, MAX_WATCH_MS, watchStretchMs } from "./run-timing";
import { migrateCareer } from "./save";
import { answerStory } from "./stories";
import { achievementBatchCount, isAchievementBatch, queueAchievements, queueBought } from "./toasts";
import type { Career } from "./types";

const store = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key),
};

const game = readFileSync(new URL("../components/game/GameApp.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const ACH_KEY = "star-achievements-v1";
const LANGS: Lang[] = ["en", "he", "es", "fr"];

function drainToSeason(start: Career): Career {
  let career = start;
  let guard = 0;
  while (guard < 250 && career.screen !== "season" && career.screen !== "retired") {
    guard += 1;
    if (career.screen === "camp") career = answerCamp(career, "shooting");
    else if (career.screen === "break") career = answerBreak(career, "pace");
    else if (career.screen === "bigmatch" && career.pending) career = skipBigMatch(career);
    else if (career.screen === "match") career = { ...career, screen: "report" };
    else if (career.screen === "report") career = afterReport(career);
    else if (career.story) career = answerStory(career, "a");
    else if (career.screen === "run") career = playStep(career);
    else break;
  }
  return career;
}

function wrapOf(start: Career): Career {
  const ended = drainToSeason(start);
  if (ended.screen === "retired") return ended;
  return ended.pendingOffers ? ended : prepareSeasonWrap(ended);
}

function clearAchievements() {
  kvRemove(ACH_KEY);
}

test("P1-1: Next season stays above the toast; multiple unlocks merge into one toast in four languages", () => {
  assert.match(css, /\.app-shell\.wrap-screen/);
  assert.match(css, /4\.75rem/);
  assert.match(game, /className="wrap-screen"/);
  assert.deepEqual(queueAchievements([], ["first_goal"]), ["first_goal"]);
  const merged = queueAchievements(["streak:7"], ["first_goal", "first_trophy", "cup"]);
  assert.deepEqual(merged, ["streak:7", "achievements:3"]);
  assert.equal(isAchievementBatch(merged[1]!), true);
  assert.equal(achievementBatchCount(merged[1]!), 3);
  for (const lang of LANGS) {
    const text = t("achievementsN", { n: 3 }, lang);
    assert.match(text, /3/);
    assert.notEqual(text, "achievementsN");
  }
});

test("P1-2: the purchase toast goes to the front immediately", () => {
  const next = queueBought(["first_goal", "streak:7"]);
  assert.deepEqual(next, ["bought", "first_goal", "streak:7"]);
  assert.deepEqual(queueBought(["bought", "cup"]), ["bought", "cup"]);
  assert.match(game, /queueBought\(list\)/);
});

test("P2-1: Season Wrap uses a single coins number and hides the earned chip", () => {
  const wrapFn = game.slice(game.indexOf("function SeasonWrap"), game.indexOf("function SeasonScreen"));
  assert.match(wrapFn, /hideEarned/);
  assert.match(wrapFn, /tr\("wrapCoins"/);
  assert.doesNotMatch(wrapFn, /<DoubleCoins career=\{career\} onChange=\{onChange\} \/>/);
  for (const lang of LANGS) {
    assert.equal(t("wrapCoins", { n: "892" }, lang).includes("892"), true);
  }
});

test("P2-2: when no rewarded video is ready, the button stays hidden and no error is shown", () => {
  assert.equal(rewardedAdReady(), false);
  assert.match(game, /if \(!ready\) return null;/);
  const rewardFn = game.slice(game.indexOf("function RewardButton"), game.indexOf("function Coin("));
  assert.doesNotMatch(rewardFn, /adUnavailable/);
});

test("P2-3: position is shown as #{pos} · {league} in four languages", () => {
  for (const lang of LANGS) {
    assert.equal(t("wrapResult", { pos: 12, league: "Spain Second Division" }, lang), "#12 · Spain Second Division");
  }
});

test("target line stores start and end OVR and labels hit or miss", () => {
  const wrap = wrapOf(createCareer("Target line", "ST", "eng", 21));
  assert.ok(wrap.growthPreview);
  assert.equal(typeof wrap.season.startOvr, "number");
  assert.equal(typeof wrap.season.endOvr, "number");
  assert.equal(wrap.season.endOvr, wrap.growthPreview.ovrAfter);
  const key = wrap.growthPreview.targetHit ? "targetHit" : "targetMissed";
  for (const lang of LANGS) {
    const label = t(key, {}, lang);
    assert.notEqual(label, key);
    assert.equal(t("wrapOvr", { a: wrap.season.startOvr ?? 0, b: wrap.season.endOvr ?? 0 }, lang).includes("OVR"), true);
  }
  assert.match(game, /data-wrap-target-line/);
});

test("target streak increments on a hit, resets on a miss, and old saves load at 0", () => {
  const fresh = createCareer("Streak save", "ST", "esp", 8);
  const raw = JSON.parse(JSON.stringify(fresh)) as Career;
  delete (raw as { targetStreak?: number }).targetStreak;
  delete (raw.season as { startOvr?: number }).startOvr;
  const loaded = migrateCareer(raw);
  assert.ok(loaded);
  assert.equal(loaded.targetStreak, undefined);
  assert.equal(loaded.targetStreak ?? 0, 0);

  const wrap = wrapOf(createCareer("Streak path", "ST", "eng", 21));
  assert.ok(wrap.growthPreview);
  const hit = commitSeason({
    ...wrap,
    screen: "season",
    targetStreak: 1,
    growthPreview: { ...wrap.growthPreview, targetHit: true },
  });
  assert.equal(hit.targetStreak, 2);
  const missed = commitSeason({
    ...wrap,
    screen: "season",
    targetStreak: 4,
    growthPreview: { ...wrap.growthPreview, targetHit: false },
  });
  assert.equal(missed.targetStreak, 0);
  for (const lang of LANGS) {
    assert.match(t("targetStreak", { n: 2 }, lang), /2/);
  }
});

test("step-up offer: every target-hit season in 20 careers has a guaranteed Step up", () => {
  const positions = ["ST", "CM", "CB", "GK"] as const;
  const countries = ["eng", "esp", "ita", "fra"] as const;
  let hits = 0;
  let misses = 0;
  for (let i = 0; i < 20; i++) {
    const wrap = wrapOf(createCareer(`Step ${i}`, positions[i % positions.length]!, countries[i % countries.length]!, 30 + i * 3));
    if (wrap.screen === "retired" || !wrap.growthPreview) continue;
    if (wrap.growthPreview.targetHit) {
      hits += 1;
      const offers = wrap.pendingOffers ?? [];
      assert.ok(offers.some((offer) => offer.stepUp), `career ${i} hit the target but had no Step up offer`);
      const step = offers.find((offer) => offer.stepUp)!;
      assert.ok(step.wage > 0);
      assert.ok(step.role);
      assert.notEqual(step.clubId, wrap.clubId);
    } else {
      misses += 1;
      assert.equal((wrap.pendingOffers ?? []).some((offer) => offer.stepUp), false);
    }

    const forced = buildOffers(
      { ...wrap, contractLeft: 1, growthPreview: { ...wrap.growthPreview, targetHit: true }, race: null },
      overall(wrap.player.position, wrap.player.attrs),
      wrap.growthPreview.tablePos,
    );
    assert.ok(forced.some((offer) => offer.stepUp), `forced hit on career ${i} must still add a Step up`);
  }
  assert.ok(hits + misses >= 15, "expected most of the 20 careers to reach a wrap");
  for (const lang of LANGS) {
    assert.notEqual(t("wrapStepUp", {}, lang), "wrapStepUp");
  }
});

test("achievement pacing: season 1 averages at most 3 unlocks; existing unlocks stay", () => {
  clearAchievements();
  kvSet(ACH_KEY, JSON.stringify({ first_goal: "2020-01-01" }));
  const empty = wrapOf(createCareer("Keep unlock", "ST", "eng", 2));
  checkAchievements({ ...empty, totals: { ...empty.totals, goals: 0 } });
  assert.equal(loadUnlocked().first_goal, "2020-01-01");
  assert.equal(ACHIEVEMENTS.some((item) => item.id === "first_goal"), true);

  const counts: number[] = [];
  const positions = ["ST", "CM", "CB", "GK"] as const;
  const countries = ["eng", "esp", "ita", "fra"] as const;
  for (let i = 0; i < 20; i++) {
    clearAchievements();
    const wrap = wrapOf(createCareer(`Pace ${i}`, positions[i % positions.length]!, countries[i % countries.length]!, 40 + i * 5));
    const fresh = checkAchievements(wrap);
    counts.push(fresh.length);
  }
  clearAchievements();
  const avg = counts.reduce((sum, n) => sum + n, 0) / counts.length;
  assert.ok(avg <= 3, `season 1 average unlocks were ${avg}, expected <= 3 (counts: ${counts.join(",")})`);
});

test("training continues automatically after the session; mid-season copy is one line", () => {
  assert.match(game, /useState\(false\)/);
  assert.doesNotMatch(game, /useState\(\(\) => Boolean\(career\.lastTrain\)\)/);
  for (const lang of LANGS) {
    const up = t("trainUp", { attr: "Pace", n: 2 }, lang);
    assert.equal(up.split(".").filter(Boolean).length, 1);
    assert.ok(!up.includes("session landed") && !up.includes("האימון תפס") && !up.includes("sesión") && !up.includes("séance a pris"));
  }
});

test("watching without decisions lasts at most 10s; a tap skips to the next event", () => {
  assert.ok(AUTO_STEP_MS < 460);
  assert.ok(watchStretchMs(50) <= MAX_WATCH_MS);
  assert.match(game, /skipToDecision/);
  assert.match(game, /AUTO_STEP_MS \/ speed/);

  let career = createCareer("Skip tap", "ST", "eng", 12);
  career = answerCamp(career, "shooting");
  let guard = 0;
  while (guard < 40 && (career.screen !== "run" || career.story)) {
    guard += 1;
    if (career.screen === "camp") career = answerCamp(career, "shooting");
    else if (career.story) career = answerStory(career, "a");
    else if (career.screen === "run") career = playStep(career);
    else break;
  }
  assert.equal(career.screen, "run");
  const skipped = runToStop(career);
  let stepped = career;
  while (stepped.screen === "run" && !stepped.story && nextFixture(stepped)) {
    stepped = playStep(stepped);
    if (stepped.story || stepped.screen !== "run") break;
  }
  assert.equal(skipped.screen, stepped.screen);
  assert.equal(Boolean(skipped.story), Boolean(stepped.story));
});
