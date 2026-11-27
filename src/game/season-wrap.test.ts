import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  TRAIN_BAR_SEGMENTS,
  answerBreak,
  answerCamp,
  afterReport,
  createCareer,
  previewBoardTarget,
  prepareSeasonWrap,
  progressTrainBar,
  skipBigMatch,
  summerWrapInfo,
  wrapNextSeason,
  playStep,
} from "./engine";
import { answerStory } from "./stories";
import type { Career } from "./types";

const game = readFileSync(new URL("../components/game/GameApp.tsx", import.meta.url), "utf8");
const i18n = readFileSync(new URL("./i18n.ts", import.meta.url), "utf8");

test("three sessions fill the training bar and grant +1; injury keeps the bar", () => {
  assert.equal(TRAIN_BAR_SEGMENTS, 3);
  let bars = {};
  const first = progressTrainBar(bars, "shooting", false, 10);
  assert.equal(first.bar, 1);
  assert.equal(first.barFull, false);
  assert.equal(first.bonus, 0);
  const second = progressTrainBar(first.trainBar, "shooting", false, 10);
  assert.equal(second.bar, 2);
  const hurt = progressTrainBar(second.trainBar, "shooting", true, 10);
  assert.equal(hurt.bar, 2);
  assert.equal(hurt.barFull, false);
  assert.equal(hurt.bonus, 0);
  assert.equal(hurt.trainBar.shooting, 2);
  const third = progressTrainBar(second.trainBar, "shooting", false, 10);
  assert.equal(third.barFull, true);
  assert.equal(third.bonus, 1);
  assert.equal(third.bar, 3);
  assert.equal(third.trainBar.shooting, 0);
  const capped = progressTrainBar(second.trainBar, "shooting", false, 0);
  assert.equal(capped.barFull, true);
  assert.equal(capped.bonus, 0);
});

test("camp and winter sessions both fill one segment", () => {
  const camp = createCareer("Wrap train", "ST", "eng", 11);
  assert.equal(camp.screen, "camp");
  const afterCamp = answerCamp(camp, "shooting");
  assert.equal(afterCamp.trainBar?.shooting ?? 0, afterCamp.lastTrain?.outFor ? 0 : 1);
  const winter: Career = { ...camp, screen: "break", trainBar: { shooting: 0 } };
  const afterBreak = answerBreak(winter, "shooting");
  if (!afterBreak.lastTrain?.outFor) {
    assert.equal(afterBreak.trainBar?.shooting, 1);
    assert.equal(afterBreak.lastTrain?.bar, 1);
  } else {
    assert.equal(afterBreak.trainBar?.shooting ?? 0, 0);
    assert.equal(afterBreak.lastTrain?.barFull, false);
  }
});

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
    else if (career.story) career = answerStory(career, "a"); else if (career.screen === "run") career = playStep(career);
    else break;
  }
  return career;
}

test("a finished season opens one wrap screen with offers ready, and Next season goes to camp", () => {
  const started = createCareer("Wrap sim", "ST", "eng", 21);
  const ended = drainToSeason(started);
  assert.equal(ended.screen, "season", `stopped on ${ended.screen} after a season`);
  const wrap = ended.pendingOffers ? ended : prepareSeasonWrap(ended);
  assert.equal(wrap.screen, "season");
  assert.ok(wrap.pendingOffers && wrap.pendingOffers.length > 0, "offers are ready on the wrap");
  assert.ok(wrap.summer, "summer has already been resolved");
  assert.equal(wrap.summer?.done, true);
  if (wrap.summer?.called) assert.ok(summerWrapInfo(wrap));
  const stay = wrap.pendingOffers.find((offer) => offer.kind === "stay") ?? wrap.pendingOffers[0];
  const next = wrapNextSeason(wrap, stay.clubId);
  assert.equal(next.screen, "camp");
  assert.equal(next.pendingOffers, null);
  assert.equal(next.year, wrap.year + 1);
  const target = previewBoardTarget(wrap, stay.clubId, stay.role);
  assert.ok(target.label.startsWith("@target."));

  assert.match(game, /function SeasonWrap/);
  assert.match(game, /data-wrap-result/);
  assert.match(game, /data-wrap-stats/);
  assert.match(game, /data-wrap-offers/);
  assert.match(game, /data-next-season/);
  assert.match(game, /tr\("nextSeason"\)/);
  assert.match(game, /tr\("nextClub"\)/);
  assert.match(game, /tr\("wrapStay"\)/);
  assert.match(game, /tr\("wrapSign"\)/);
  assert.match(game, /tr\("wrapRetire"\)/);
  assert.match(game, /wrapNextSeason/);
  assert.doesNotMatch(game.slice(game.indexOf("function SeasonWrap"), game.indexOf("function SeasonScreen")), /startSummer\(/);
  assert.match(i18n, /nextClub: "Your next club"/);
  assert.match(i18n, /nextClub: "הקבוצה הבאה שלך"/);
  assert.match(i18n, /wrapStay: "Stay"/);
  assert.match(i18n, /wrapStay: "נשארים"/);
  assert.match(i18n, /wrapSign: "Sign"/);
  assert.match(i18n, /wrapSign: "חותמים"/);
  assert.match(i18n, /nextSeason: "Next season"/);
  assert.match(i18n, /nextSeason: "לעונה הבאה"/);
});
