import assert from "node:assert/strict";
import { test } from "node:test";
import { createCareer, finishBigMatch, keyFixtureIds, playStep, resolveMoment, skipBigMatch } from "./engine";
import type { Career, MomentOption } from "./types";

function bestOption(options: MomentOption[]) {
  return options.reduce((best, option) => (option.odds > best.odds ? option : best));
}

function openKey(seed: number) {
  const before = createCareer("Skip", "ST", "eng", seed);
  before.screen = "run";
  const index = before.season.fixtures.findIndex((fixture) => keyFixtureIds(before.season, before.clubId).includes(fixture.id));
  assert.ok(index >= 0);
  before.season.cursor = index;
  const opened = playStep(before);
  assert.equal(opened.screen, "bigmatch");
  assert.ok(opened.pending);
  assert.ok(opened.pending.moments.every((moment) => !moment.picked));
  return { before, opened };
}

/** What skip should match: keep choices already made, take the rest on the highest odds, then finish. */
function autoFinish(career: Career) {
  let current = career;
  const count = current.pending?.moments.length ?? 0;
  for (let index = 0; index < count; index += 1) {
    const moment = current.pending!.moments[index];
    if (moment.picked) continue;
    current = resolveMoment(current, index, bestOption(moment.options).id);
  }
  return finishBigMatch(current);
}

function snapshot(career: Career) {
  const report = career.activeReport;
  const row = career.season.table.find((item) => item.clubId === career.clubId);
  const log = career.season.fixturesPlayed[career.season.fixturesPlayed.length - 1];
  return {
    screen: career.screen,
    pending: career.pending ?? null,
    missed: report?.missed ?? null,
    missReason: report?.missReason ?? null,
    us: report?.us,
    them: report?.them,
    rating: report?.rating,
    goals: report?.goals,
    assists: report?.assists,
    events: report?.events.map((event) => `${event.minute}|${event.tone}|${event.text}|${event.us}|${event.them}`),
    apps: career.season.apps,
    totalsApps: career.totals.apps,
    cursor: career.season.cursor,
    fitness: career.player.fitness,
    form: career.player.form,
    morale: career.player.morale,
    attrs: career.player.attrs,
    coins: career.coins,
    coinsEarnedLast: career.coinsEarnedLast,
    coinsFixtureId: career.coinsFixtureId,
    seasonCoins: career.seasonCoins,
    keyWins: career.season.keyWins ?? 0,
    pts: row?.pts,
    gf: row?.gf,
    ga: row?.ga,
    key: log?.key ?? false,
    logMissed: log?.missed ?? null,
    outFor: career.season.outFor,
  };
}

test("skipping a key match before any moment plays it and applies key-match rules", () => {
  for (const seed of [1, 2, 7, 11, 19, 42]) {
    const { before, opened } = openKey(seed);
    assert.equal(finishBigMatch(opened), opened);
    const skipped = skipBigMatch(opened);
    assert.deepEqual(snapshot(skipped), snapshot(autoFinish(structuredClone(opened))));
    const report = skipped.activeReport;
    assert.ok(report);
    assert.equal(skipped.screen, "report");
    assert.equal(skipped.pending ?? null, null);
    assert.equal(report.missed, false);
    assert.equal(report.missReason, undefined);
    assert.equal(skipped.season.apps, before.season.apps + 1);
    assert.equal(skipped.totals.apps, before.totals.apps + 1);
    assert.equal(skipped.season.cursor, before.season.cursor + 1);
    assert.ok(skipped.player.fitness < before.player.fitness);
    assert.equal(skipped.season.fixturesPlayed.at(-1)?.key, true);
    assert.equal(skipped.season.fixturesPlayed.at(-1)?.missed, false);
    const pts = report.us > report.them ? 3 : report.us === report.them ? 1 : 0;
    const beforeRow = before.season.table.find((row) => row.clubId === before.clubId);
    const afterRow = skipped.season.table.find((row) => row.clubId === skipped.clubId);
    assert.ok(beforeRow && afterRow);
    assert.equal(afterRow.pts, beforeRow.pts + pts * 2);
    assert.equal(afterRow.gf, beforeRow.gf + report.us);
    assert.equal(afterRow.ga, beforeRow.ga + report.them);
    assert.equal(skipped.season.keyWins ?? 0, (before.season.keyWins ?? 0) + (report.us > report.them ? 1 : 0));
    assert.equal(skipped.coins - before.coins, skipped.coinsEarnedLast);
    assert.equal(skipped.coinsFixtureId, report.fixtureId);
  }
});

test("skipping mid-match keeps moments already resolved", () => {
  const { opened } = openKey(1);
  const first = opened.pending!.moments[0];
  const choice = first.options[first.options.length - 1];
  const best = bestOption(first.options);
  assert.notEqual(choice.id, best.id);
  const chosen = resolveMoment(opened, 0, choice.id);
  assert.equal(chosen.pending!.moments[0].picked, choice.id);
  const skipped = skipBigMatch(chosen);
  assert.deepEqual(snapshot(skipped), snapshot(autoFinish(structuredClone(chosen))));
  const minute = first.minute;
  const kept = skipped.activeReport?.events.find((event) => event.minute === minute && event.text.startsWith("@mo."));
  const fresh = skipBigMatch(opened).activeReport?.events.find((event) => event.minute === minute && event.text.startsWith("@mo."));
  assert.equal(kept?.text.endsWith(`.${choice.id}`), true);
  assert.equal(fresh?.text.endsWith(`.${best.id}`), true);
  assert.notEqual(kept?.text, fresh?.text);
});

test("skip does nothing outside a live key match", () => {
  const career = createCareer("Idle", "CM", "esp", 3);
  assert.equal(skipBigMatch(career), career);
  const { opened } = openKey(4);
  const cleared = { ...opened, pending: null };
  assert.equal(skipBigMatch(cleared), cleared);
  const running = { ...opened, screen: "run" as const };
  assert.equal(skipBigMatch(running), running);
});

test("an injured player who skips a key match still takes part", () => {
  const { opened } = openKey(15);
  const injured = { ...opened, season: { ...opened.season, outFor: 4 } };
  const skipped = skipBigMatch(injured);
  assert.deepEqual(snapshot(skipped), snapshot(autoFinish(structuredClone(injured))));
  assert.equal(skipped.activeReport?.missed, false);
  assert.equal(skipped.activeReport?.missReason, undefined);
  assert.equal(skipped.season.apps, injured.season.apps + 1);
});
