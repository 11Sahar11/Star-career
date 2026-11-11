import assert from "node:assert/strict";
import { test } from "node:test";
import { earnForReport } from "./economy";
import {
  answerCamp,
  coinMultiplier,
  createCareer,
  createDailyCareer,
  finishBigMatch,
  isBrandNewCareer,
  keyFixtureIds,
  playStep,
  resolveMoment,
  skipBigMatch,
  trainOdds,
} from "./engine";
import { rollStory } from "./stories";
import type { Career } from "./types";

function finishAll(career: Career) {
  let current = career;
  const count = current.pending?.moments.length ?? 0;
  for (let index = 0; index < count; index += 1) {
    const moment = current.pending?.moments[index];
    if (!moment || moment.picked) continue;
    const option = moment.options[0];
    current = resolveMoment(current, index, option.id);
  }
  return finishBigMatch(current);
}

test("a 16-year-old on normal difficulty has the real pre-season odds", () => {
  const career = createCareer("Odds", "ST", "eng", 1);
  assert.equal(career.player.age, 16);
  for (const key of ["pace", "shooting", "passing"] as const) {
    assert.deepEqual(trainOdds(career, key), { big: 16, up: 48, down: 11 });
  }
});

test("a brand-new career opens the first match on an unpicked decision", () => {
  const fresh = createCareer("Ada", "ST", "eng", 3);
  assert.equal(fresh.screen, "camp");
  assert.equal(rollStory(fresh, () => 0), null);
  const opened = answerCamp(fresh, "shooting");
  assert.equal(opened.screen, "bigmatch");
  assert.ok(opened.pending);
  assert.equal(opened.pending.moments.length > 0, true);
  assert.equal(opened.pending.moments.every((moment) => !moment.picked), true);
  assert.equal(opened.story ?? null, null);
  assert.equal(opened.season.fixturesPlayed.length, 0);
  assert.equal(opened.season.cursor, 0);
  assert.equal(opened.coins, 0);
  assert.equal(opened.pending.base.fixtureId, fresh.season.fixtures[0]?.id);
  const scheduled = keyFixtureIds(fresh.season, fresh.clubId).includes(fresh.season.fixtures[0].id);
  assert.equal(Boolean(opened.pending.opening), !scheduled);
});

test("playStep on a brand-new career does not simulate the match away", () => {
  const fresh = createCareer("Bea", "CM", "esp", 4);
  const stepped = playStep({ ...fresh, screen: "run" });
  assert.equal(stepped.screen, "bigmatch");
  assert.equal(stepped.season.cursor, 0);
  assert.equal(stepped.season.fixturesPlayed.length, 0);
  assert.equal(stepped.story ?? null, null);
});

function withFirstFixture(career: Career, fixtureId: string) {
  const index = career.season.fixtures.findIndex((fixture) => fixture.id === fixtureId);
  assert.ok(index >= 0);
  const fixtures = [...career.season.fixtures];
  const [fixture] = fixtures.splice(index, 1);
  fixtures.unshift(fixture);
  return { ...career, season: { ...career.season, fixtures } };
}

test("an opening match that is not a key fixture keeps normal coins and points", () => {
  const base = createCareer("Cara", "W", "eng", 8);
  const keys = new Set(keyFixtureIds(base.season, base.clubId));
  const ordinary = base.season.fixtures.find((fixture) => fixture.competition === "league" && !keys.has(fixture.id));
  assert.ok(ordinary);
  const fresh = withFirstFixture(base, ordinary.id);
  const opened = answerCamp(fresh, "pace");
  assert.equal(opened.screen, "bigmatch");
  assert.equal(opened.pending?.opening, true);
  assert.equal(opened.pending?.base.fixtureId, ordinary.id);
  const before = opened.season.table.find((row) => row.clubId === opened.clubId);
  const done = finishAll(opened);
  const report = done.activeReport;
  assert.ok(before && report);
  const pts = report.us > report.them ? 3 : report.us === report.them ? 1 : 0;
  const after = done.season.table.find((row) => row.clubId === done.clubId);
  assert.equal(after?.pts, (before?.pts ?? 0) + pts);
  assert.equal(done.season.fixturesPlayed.at(-1)?.key ?? false, false);
  assert.equal(done.season.keyWins ?? 0, 0);
  assert.equal(done.coins, Math.round(earnForReport(report, false) * coinMultiplier(fresh)));
  assert.equal(done.season.fixturesPlayed.length, 1);
  assert.equal(done.story ?? null, null);
});

test("a scheduled key opening still uses key-match rules", () => {
  const base = createCareer("Dax", "CB", "esp", 11);
  const keyId = keyFixtureIds(base.season, base.clubId)[0];
  assert.ok(keyId);
  const fresh = withFirstFixture(base, keyId);
  const opened = answerCamp(fresh, "tackle");
  assert.equal(opened.pending?.opening, undefined);
  assert.equal(opened.pending?.base.fixtureId, keyId);
  const done = skipBigMatch(opened);
  assert.equal(done.season.fixturesPlayed.at(-1)?.key, true);
});

test("later seasons and the daily race still leave camp into the run", () => {
  const started = createCareer("Eve", "CM", "esp", 2);
  assert.equal(isBrandNewCareer(started), true);
  const later = answerCamp({ ...started, totals: { ...started.totals, apps: 3 } }, "passing");
  assert.equal(later.screen, "run");
  assert.equal(later.pending ?? null, null);
  const daily = answerCamp(createDailyCareer("Race"), "pace");
  assert.equal(daily.screen, "run");
  assert.equal(daily.race != null, true);
});

test("skipping an opening match does not mark the player missed", () => {
  const base = createCareer("Fay", "ST", "eng", 15);
  const keys = new Set(keyFixtureIds(base.season, base.clubId));
  const ordinary = base.season.fixtures.find((fixture) => fixture.competition === "league" && !keys.has(fixture.id));
  assert.ok(ordinary);
  const opened = answerCamp(withFirstFixture(base, ordinary.id), "shooting");
  assert.equal(opened.pending?.opening, true);
  const skipped = skipBigMatch(opened);
  assert.equal(skipped.screen, "report");
  assert.equal(skipped.activeReport?.missed, false);
  assert.equal(skipped.season.apps, 1);
});
