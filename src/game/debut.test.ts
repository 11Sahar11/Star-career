import assert from "node:assert/strict";
import { test } from "node:test";
import { ATTR_KEYS, type Career } from "./types";
import { earnForReport, storeShelf } from "./economy";
import { t } from "./i18n";
import { migrateCareer } from "./save";
import {
  afterReport,
  answerCamp,
  coinMultiplier,
  createCareer,
  createDailyCareer,
  finishBigMatch,
  displayedTrainLine,
  formatTrainOdds,
  isBigFixture,
  keyFixtureIds,
  openDebutMatch,
  resolveMoment,
  sessionTrainOdds,
  skipBigMatch,
  statCap,
  trainBucket,
  trainOdds,
  trainOutcomes,
} from "./engine";
import { debutHidesTopSkip, shouldResetTrainReveal, tabFromLockedLeaguesRow, trainingMaxLabel } from "./ux";
import type { MomentOption } from "./types";

function bestOption(options: MomentOption[]) {
  return options.reduce((best, option) => (option.odds > best.odds ? option : best));
}

function withFirstFixture(career: Career, fixtureId: string) {
  const index = career.season.fixtures.findIndex((fixture) => fixture.id === fixtureId);
  assert.ok(index >= 0);
  const fixtures = [...career.season.fixtures];
  const [fixture] = fixtures.splice(index, 1);
  fixtures.unshift(fixture);
  return { ...career, season: { ...career.season, fixtures } };
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
  const base = createCareer("Alex", "CM", "esp", 9);
  const keys = new Set(keyFixtureIds(base.season, base.clubId));
  const ordinary = base.season.fixtures.find((fixture) => fixture.competition === "league" && !keys.has(fixture.id));
  assert.ok(ordinary);
  const career = withFirstFixture(base, ordinary.id);
  const opened = openDebutMatch(career);
  assert.equal(opened.pending?.debut, true);
  assert.equal(debutHidesTopSkip(opened.pending?.debut, null, 0), true);
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

function bucketCounts(odds: { up: number; big: number; down: number }) {
  const counts = { up: 0, flat: 0, big: 0, down: 0 };
  for (let roll = 0; roll < 100; roll += 1) counts[trainBucket(roll, odds)] += 1;
  return counts;
}

test("training odds printed on the session come from trainOdds", () => {
  const career = createCareer("Alex", "ST", "eng", 4);
  const line = sessionTrainOdds(career);
  assert.ok(line);
  assert.deepEqual(line, { up: 48, big: 16, down: 11 });
  for (const key of ATTR_KEYS) assert.deepEqual(trainOdds(career, key), line);
  const shown = displayedTrainLine(career, null, "en");
  assert.equal(shown, "48% +1 · 25% no change · 16% +3 · 11% injury");
  const counts = bucketCounts(line);
  for (const part of trainOutcomes(line)) {
    assert.equal(counts[part.id], part.n);
    assert.ok(shown?.includes(`${part.n}%`));
  }
  assert.equal(trainOutcomes(line)[0]?.id, "up");
  for (const key of ATTR_KEYS) assert.equal(displayedTrainLine(career, key, "en"), null);
  for (const lang of ["he", "es", "fr"] as const) {
    const text = displayedTrainLine(career, null, lang);
    assert.equal(text?.split(" · ")[0], t("train.part.up", { n: 48 }, lang));
  }
  career.difficulty = "hard";
  const hard = sessionTrainOdds(career);
  assert.ok(hard);
  assert.deepEqual(hard, trainOdds(career, "shooting"));
  assert.notDeepEqual(hard, line);
});

test("mixed training odds are each stat's own roll, and a ceiling has no plus", () => {
  const career = createCareer("Nia", "ST", "eng", 5);
  career.player.age = 31;
  const room = (key: (typeof ATTR_KEYS)[number], below: number) => {
    career.player.attrs[key] = statCap(career.player.position, career.player.potential, key) - below;
  };
  room("shooting", 4);
  room("physical", 4);
  room("passing", 1);
  for (const key of ["pace", "tackle", "dribbling"] as const) room(key, 0);
  const open = trainOdds(career, "shooting");
  const tight = trainOdds(career, "passing");
  const capped = trainOdds(career, "pace");
  assert.ok(open.big > 0 && open.up > 0);
  assert.equal(tight.big, 0);
  assert.ok(tight.up > 0);
  assert.equal(capped.big, 0);
  assert.equal(capped.up, 0);
  assert.equal(sessionTrainOdds(career), null);
  assert.equal(displayedTrainLine(career, null, "en"), null);
  for (const lang of ["en", "he", "es", "fr"] as const) {
    for (const key of ATTR_KEYS) {
      const odds = trainOdds(career, key);
      const shown = displayedTrainLine(career, key, lang);
      assert.equal(shown, formatTrainOdds(odds, lang));
      assert.ok(shown);
      const counts = bucketCounts(odds);
      const parts = trainOutcomes(odds);
      assert.deepEqual(
        shown.split(" · "),
        parts.map((part) => t(`train.part.${part.id}`, { n: part.n }, lang)),
      );
      for (const part of parts) assert.equal(counts[part.id], part.n);
      if (odds.up === 0 && odds.big === 0) assert.equal(shown.includes("+"), false);
    }
  }
});

test("the store before a career lists only unlocks and cosmetics", () => {
  const before = storeShelf(true);
  assert.deepEqual(before.items, ["unlock-country", "cos-crest", "cos-shirt", "cos-legend", "cos-armband"]);
  assert.deepEqual(before.rewards, []);
  for (const id of ["trial", "camp-premium", "camp-key", "agent", "med-fast", "med-rest"] as const) {
    assert.equal(before.items.includes(id), false);
  }
  const during = storeShelf(false);
  assert.ok(during.items.includes("camp-premium"));
  assert.ok(during.items.includes("trial"));
  assert.deepEqual(during.rewards, ["free-camp", "store-discount", "gear-offer"]);
});

test("a premium camp clears the reveal so the second pick lands", () => {
  const career = createCareer("Pia", "CM", "esp", 6);
  career.premiumCamp = true;
  const first = answerCamp(career, "shooting");
  assert.equal(shouldResetTrainReveal(career.premiumCamp, first), true);
  assert.equal(first.screen, "camp");
  assert.equal(first.premiumCamp, false);
  assert.equal(first.lastTrain?.key, "shooting");
  const second = answerCamp(first, "passing");
  assert.equal(shouldResetTrainReveal(first.premiumCamp, second), false);
  assert.equal(second.screen, "run");
  assert.equal(second.lastTrain?.key, "passing");
});

test("a capped training stat shows MAX and an open stat does not", () => {
  const career = createCareer("Max", "ST", "eng", 5);
  const paceCap = statCap(career.player.position, career.player.potential, "pace");
  career.player.attrs.pace = paceCap;
  const shootingCap = statCap(career.player.position, career.player.potential, "shooting");
  career.player.attrs.shooting = shootingCap - 4;
  const pace = trainingMaxLabel(career.player.position, career.player.potential, career.player.attrs.pace, "pace");
  const shooting = trainingMaxLabel(career.player.position, career.player.potential, career.player.attrs.shooting, "shooting");
  assert.equal(pace, "mo.max");
  assert.equal(shooting, null);
  assert.equal(t("mo.max", undefined, "en"), "MAX");
  assert.equal(t("mo.max", undefined, "he"), "מקס");
  assert.equal(t("mo.max", undefined, "es"), "MÁX");
  assert.equal(t("mo.max", undefined, "fr"), "MAX");
  assert.equal(trainingMaxLabel(career.player.position, career.player.potential, paceCap - 1, "pace"), null);
});

test("the locked-leagues row opens the store tab", () => {
  assert.equal(tabFromLockedLeaguesRow(), "store");
});

test("a scheduled key opening keeps key-match rules, including skip", () => {
  const base = createCareer("Dax", "CB", "esp", 11);
  const keyId = keyFixtureIds(base.season, base.clubId)[0];
  assert.ok(keyId);
  const fresh = withFirstFixture(base, keyId);
  const opened = openDebutMatch(fresh);
  assert.equal(opened.screen, "bigmatch");
  assert.equal(opened.pending?.debut, undefined);
  assert.equal(opened.pending?.moments[0]?.minute, 1);
  assert.equal(opened.campPending, true);
  assert.equal(debutHidesTopSkip(opened.pending?.debut, null, 0), false);
  const before = opened.season.table.find((row) => row.clubId === opened.clubId);
  const done = skipBigMatch(opened);
  const report = done.activeReport;
  assert.ok(before && report);
  assert.equal(done.screen, "report");
  assert.equal(done.pending ?? null, null);
  assert.equal(done.season.fixturesPlayed.at(-1)?.key, true);
  const pts = report.us > report.them ? 3 : report.us === report.them ? 1 : 0;
  const after = done.season.table.find((row) => row.clubId === done.clubId);
  assert.equal(after?.pts, (before.pts ?? 0) + pts * 2);
  assert.equal(done.season.keyWins ?? 0, report.us > report.them ? 1 : 0);
  const normal = Math.round(earnForReport(report, false) * coinMultiplier(fresh));
  if (report.us > report.them) assert.ok((done.coinsEarnedLast ?? 0) > normal);
  assert.equal(afterReport(done).screen, "camp");
});

test("an older save without opening-match fields still loads", () => {
  const career = createCareer("Old", "ST", "eng", 3);
  const raw = JSON.parse(JSON.stringify(career)) as Career;
  delete raw.campPending;
  const loaded = migrateCareer(raw);
  assert.ok(loaded);
  assert.equal(loaded.player.name, "Old");
  assert.equal(loaded.campPending, undefined);
  assert.equal(loaded.screen, "camp");
  assert.equal(loaded.version, career.version);
  const opened = openDebutMatch(career);
  const round = migrateCareer(JSON.parse(JSON.stringify(opened)));
  assert.equal(round?.screen, "bigmatch");
  assert.equal(round?.campPending, true);
  assert.equal(round?.pending?.debut, opened.pending?.debut);
  assert.equal(round?.pending?.moments[0]?.minute, 1);
});
