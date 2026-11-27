import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { buy, canBuy } from "./economy";
import { CLUBS, assignClubCodes, clubCode } from "./data";
import {
  afterReport,
  answerBreak,
  answerCamp,
  applyReport,
  computeGrowth,
  contractTerms,
  createCareer,
  emptyAttrs,
  formatWage,
  goldenBootGoals,
  keyFixtureIds,
  leagueFixtureTotal,
  matchdayCount,
  matchdayProgress,
  playStep,
  playedApps,
  rowPoints,
  seasonGoalForRank,
  skipBigMatch,
} from "./engine";
import { answerStory } from "./stories";
import { t } from "./i18n";
import type { Career, MatchReport } from "./types";

const game = readFileSync(new URL("../components/game/GameApp.tsx", import.meta.url), "utf8");
const i18n = readFileSync(new URL("./i18n.ts", import.meta.url), "utf8");

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

function reportFor(career: Career, extra: Partial<MatchReport> = {}): MatchReport {
  const fixture = career.season.fixtures[career.season.cursor];
  assert.ok(fixture, "expected a fixture");
  return {
    fixtureId: fixture.id,
    competition: fixture.competition,
    round: fixture.round,
    roundLabel: fixture.roundLabel,
    opponentName: fixture.opponentName,
    home: fixture.home,
    us: 1,
    them: 0,
    missed: false,
    rating: 7.2,
    goals: 0,
    assists: 0,
    tackles: 1,
    keyPasses: 0,
    saves: 0,
    shots: 1,
    errors: 0,
    injured: false,
    events: [],
    deltas: emptyAttrs(),
    headline: "Test report",
    ...extra,
  };
}

test("2. a purchase confirms immediately and marks the item owned", () => {
  const career = { ...createCareer("Shop", "ST", "eng", 2), coins: 2000, screen: "run" as const };
  const bought = buy(career, "agent", "2026-11-27");
  assert.equal(bought.agentHired, true);
  assert.equal(bought.coins, career.coins - 400);
  assert.equal(canBuy(bought, "agent", "2026-11-27"), "owned");
  assert.match(i18n, /bought: "Bought"/);
  assert.match(i18n, /bought: "נקנה"/);
  assert.match(i18n, /bought: "Comprado"/);
  assert.match(i18n, /bought: "Acheté"/);
  assert.match(game, /data-bought-toast/);
  assert.match(game, /tr\("bought"\)/);
  assert.match(game, /data-item-owned/);
  assert.match(game, /tr\("itemOwned"\)/);
  assert.match(game, /data-item-active/);
  assert.match(game, /onBought\?\.\(\)/);
});

test("3. an injured player never plays, including key matches, and the return card waits until the spell ends", () => {
  const career = createCareer("Hurt", "ST", "eng", 3);
  career.screen = "run";
  const keyIndex = career.season.fixtures.findIndex((fixture) => keyFixtureIds(career.season, career.clubId).includes(fixture.id));
  assert.ok(keyIndex >= 0);
  career.season.cursor = keyIndex;
  career.season.outFor = 3;
  const stepped = playStep(career);
  assert.notEqual(stepped.screen, "bigmatch");
  assert.equal(stepped.activeReport?.missed, true);
  assert.equal(stepped.activeReport?.missReason, "injury");
  assert.equal(stepped.season.apps, career.season.apps);
  assert.equal(stepped.season.outFor, 2);

  const hurt = applyReport({ ...career, season: { ...career.season, cursor: 0, outFor: 0 }, screen: "run" }, reportFor({ ...career, season: { ...career.season, cursor: 0 } }, { injured: true }), () => 0.5, "report");
  assert.ok(hurt.season.outFor > 0);
  assert.equal(hurt.justRecovered, false);
  const afterHurt = afterReport(hurt);
  assert.equal(afterHurt.healEligible, false);

  let spell = applyReport({ ...career, season: { ...career.season, cursor: 0, outFor: 1 }, screen: "run" }, reportFor({ ...career, season: { ...career.season, cursor: 0 } }, { missed: true, missReason: "injury", injured: false }), () => 0.5, "run");
  assert.equal(spell.season.outFor, 0);
  assert.equal(spell.justRecovered, true);

  assert.match(game, /career\.healEligible/);
  assert.match(game, /data-back-from-injury/);
  assert.match(i18n, /backFromInjury:/);
});

test("4–5. a full season keeps apps, boot, points, attributes, and matchdays consistent", () => {
  const started = createCareer("Consistency", "ST", "eng", 31);
  const startAttrs = { ...(started.season.startAttrs ?? started.player.attrs) };
  const startRank = started.season.startRank;
  const startGoal = started.season.targetLabel;
  const teams = 24;
  assert.equal(leagueFixtureTotal(started), 2 * (teams - 1));
  assert.equal(matchdayProgress(started).m, 46);
  const leagueFixtures = started.season.fixtures.filter((item) => item.competition === "league").length;
  assert.equal(leagueFixtures, 46);

  const ended = drainToSeason(started);
  assert.equal(ended.screen, "season", `stopped on ${ended.screen}`);
  const logs = ended.season.fixturesPlayed;
  assert.equal(ended.season.apps, playedApps(logs));
  assert.equal(ended.season.apps, logs.filter((item) => !item.missed).length);
  assert.ok(logs.length >= ended.season.apps);
  assert.equal(goldenBootGoals(ended), ended.season.leagueGoals);
  const boot = ended.growthPreview?.awards.find((award) => award.name === "@award.boot");
  if (boot) assert.equal(boot.detail, `@award.bootD|${ended.season.leagueGoals}`);
  for (const row of ended.season.table) {
    assert.equal(row.pts, rowPoints(row), `${row.clubId} pts ${row.pts} != 3W+D ${rowPoints(row)}`);
  }
  const preview = ended.growthPreview ?? computeGrowth(ended);
  const start = ended.season.startAttrs ?? startAttrs;
  for (const key of Object.keys(preview.deltas) as (keyof typeof preview.deltas)[]) {
    assert.equal(preview.deltas[key], preview.after[key] - start[key], `${key} display ${preview.deltas[key]} != end-start`);
  }
  assert.deepEqual(start, startAttrs);
  assert.equal(ended.season.targetLabel, startGoal);
  assert.equal(ended.season.startRank, startRank);
  const day = matchdayProgress(ended);
  assert.equal(day.m, 46);
  assert.equal(day.n, 46);
  const count = matchdayCount(ended);
  assert.equal(count.total, 46);
  assert.equal(count.played, 46);
  if (count.cupTotal > 0) {
    assert.ok(count.cupPlayed <= count.cupTotal);
  }
  assert.match(game, /matchdayProgress\(career\)/);
  assert.match(game, /tr\("cupDay"/);
  assert.match(game, /ATTR_KEYS\.filter\(\(key\) => preview\.deltas\[key\] !== 0\)/);
  assert.match(game, /item\.missed \? tr\("unplayed"\)/);
});

test("6. the match report shows +coins once", () => {
  assert.match(game, /data-coins-earned/);
  assert.match(game, /tr\("eco\.earned"/);
  const reportFn = game.slice(game.indexOf("function ReportScreen"), game.indexOf("function Mini"));
  const earnedHits = reportFn.split('tr("eco.earned"').length - 1;
  assert.equal(earnedHits, 1, "ReportScreen should render eco.earned once");
  assert.match(game, /extra=\{playing === "main" \? <DoubleCoins career=\{run\} onChange=\{update\} hideEarned/);
});

test("7. contracts use one wage and length source across screens", () => {
  assert.equal(formatWage(1300, "£"), "£1,300 / month");
  const career = createCareer("Contract", "ST", "eng", 7);
  const terms = contractTerms(career);
  assert.equal(terms.length, career.contractYears ?? career.contractLeft);
  assert.equal(terms.left, career.contractLeft);
  const signed = contractTerms({ ...career, contractYears: 3, contractLeft: 1 });
  assert.equal(signed.length, 3);
  assert.equal(signed.left, 1);
  assert.match(i18n, /contractLengthOne: "Length: 1 year"/);
  assert.match(game, /tr\("wageMonth"/);
  assert.match(game, /tr\("contractLengthOne"\)/);
  assert.match(game, /data-contract-length/);
  assert.match(game, /data-contract-wage/);
});

test("8. team codes are unique across all leagues", () => {
  const codes = assignClubCodes(CLUBS);
  const values = Object.values(codes);
  assert.equal(values.length, CLUBS.length);
  assert.equal(new Set(values).size, values.length);
  const chesterfield = CLUBS.find((club) => club.name === "Chesterfield Knights");
  const cheltenham = CLUBS.find((club) => club.name === "Cheltenham Bears");
  assert.ok(chesterfield && cheltenham);
  assert.equal(clubCode(chesterfield.id, chesterfield.name), "CHF");
  assert.equal(clubCode(cheltenham.id, cheltenham.name), "CHE");
  assert.notEqual(clubCode(chesterfield.id), clubCode(cheltenham.id));
});

test("9. the season report omits Down when nobody went down", () => {
  assert.match(game, /career\.shuffle\.relegated\.length \? <p>\{tr\("down"/);
  assert.doesNotMatch(game.slice(game.indexOf("tr(\"down\""), game.indexOf("tr(\"down\"") + 80), /names\(career\.shuffle\.relegated\) \}\}<\/p>/);
});

test("10. one primary season goal is fixed from the start ranking", () => {
  assert.deepEqual(seasonGoalForRank(24, 1), { label: "@target.win", line: 1 });
  assert.deepEqual(seasonGoalForRank(24, 4), { label: "@target.four", line: 4 });
  assert.deepEqual(seasonGoalForRank(24, 12), { label: "@target.half", line: 12 });
  assert.deepEqual(seasonGoalForRank(24, 13), { label: "@target.stay", line: 22 });
  const career = createCareer("Goal", "ST", "eng", 13);
  const label = career.season.targetLabel;
  const rank = career.season.startRank;
  assert.ok(rank && rank >= 1);
  if (rank === 13) assert.equal(label, "@target.stay");
  assert.notEqual(rank === 13 && label, "@target.win");
  const thirteenth = seasonGoalForRank(24, 13);
  assert.notEqual(thirteenth.label, "@target.win");
  const mid = { ...career, role: "Star" as const, season: { ...career.season, table: career.season.table.map((row, i) => ({ ...row, pts: i === 0 ? 0 : 3 })) } };
  const ended = { ...mid };
  assert.equal(ended.season.targetLabel, label);
  assert.equal(ended.season.startRank, rank);
});

test("11. the first decision shows the odds hint once, in all four languages", () => {
  assert.equal(t("oddsHint", undefined, "en"), "% = your chance. Better stats, better odds.");
  assert.equal(t("oddsHint", undefined, "he"), "% = הסיכוי שלך. סטטיסטיקה טובה יותר, סיכוי טוב יותר.");
  assert.ok(t("oddsHint", undefined, "es"));
  assert.ok(t("oddsHint", undefined, "fr"));
  assert.match(game, /data-odds-hint/);
  assert.match(game, /tr\("oddsHint"\)/);
  assert.match(game, /oddsHintSeen/);
});
