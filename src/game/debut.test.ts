import assert from "node:assert/strict";
import { test } from "node:test";
import { ATTR_KEYS } from "./types";
import { earnForReport } from "./economy";
import {
  afterReport,
  coinMultiplier,
  createCareer,
  createDailyCareer,
  finishBigMatch,
  isBigFixture,
  keyFixtureIds,
  openDebutMatch,
  resolveMoment,
  sessionTrainOdds,
  skipBigMatch,
  trainOdds,
} from "./engine";
import type { MomentOption } from "./types";

function bestOption(options: MomentOption[]) {
  return options.reduce((best, option) => (option.odds > best.odds ? option : best));
}

test("a new career opens on the first decision, in minute 1", () => {
  const career = createCareer("Alex", "ST", "eng", 4, "normal", "eng");
  const opened = openDebutMatch(career);
  assert.equal(opened.screen, "bigmatch");
  assert.equal(opened.story ?? null, null);
  assert.equal(opened.campPending, true);
  assert.equal(opened.pending?.debut, true);
  assert.equal(opened.season.cursor, 0);
  assert.equal(opened.season.fixturesPlayed.length, 0);
  const minutes = opened.pending?.moments.map((moment) => moment.minute) ?? [];
  assert.equal(minutes[0], 1);
  assert.equal(new Set(minutes).size, minutes.length);
  assert.equal(isBigFixture(career, career.season.fixtures[0]), false);
  assert.ok(!keyFixtureIds(career.season, career.clubId).includes(career.season.fixtures[0].id));
});

test("the opening match pays like a normal match, then pre-season", () => {
  const career = createCareer("Alex", "CM", "esp", 9);
  const opened = openDebutMatch(career);
  const finished = skipBigMatch(opened);
  const report = finished.activeReport;
  assert.ok(report);
  assert.equal(finished.screen, "report");
  assert.equal(finished.pending ?? null, null);
  assert.equal(finished.story ?? null, null);
  assert.equal(finished.season.fixturesPlayed.at(-1)?.key ?? false, false);
  assert.equal(finished.season.keyWins ?? 0, 0);
  const pts = report.us > report.them ? 3 : report.us === report.them ? 1 : 0;
  const row = finished.season.table.find((item) => item.clubId === finished.clubId);
  assert.equal(row?.pts, pts);
  assert.equal(finished.coinsEarnedLast, Math.round(earnForReport(report, false) * coinMultiplier(career)));
  const camp = afterReport(finished);
  assert.equal(camp.screen, "camp");
  assert.equal(camp.campPending, false);
  assert.equal(camp.story ?? null, null);
});

test("choosing the first option leaves the match paused on that result", () => {
  const opened = openDebutMatch(createCareer("Alex", "GK", "eng", 2));
  const first = opened.pending!.moments[0];
  assert.equal(first.minute, 1);
  const chosen = resolveMoment(opened, 0, bestOption(first.options).id);
  assert.equal(chosen.screen, "bigmatch");
  assert.equal(chosen.pending?.moments[0].picked, bestOption(first.options).id);
  assert.equal(chosen.pending?.moments[1].picked, undefined);
  assert.equal(finishBigMatch(chosen), chosen);
});

test("debut does not replace a daily race or a season already underway", () => {
  const daily = createDailyCareer("Ada", "2026-11-11");
  assert.equal(openDebutMatch(daily), daily);
  const started = createCareer("Alex", "ST", "eng", 1);
  started.screen = "run";
  assert.equal(openDebutMatch(started), started);
});

test("training odds printed on the session come from trainOdds", () => {
  const career = createCareer("Alex", "ST", "eng", 4);
  const line = sessionTrainOdds(career);
  assert.deepEqual(line, { up: 48, big: 16, down: 11 });
  for (const key of ATTR_KEYS) assert.deepEqual(trainOdds(career, key), line);
  career.difficulty = "hard";
  const hard = sessionTrainOdds(career);
  assert.deepEqual(hard, trainOdds(career, "shooting"));
  assert.notDeepEqual(hard, line);
});
