import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { EARN, earnForReport } from "./economy";
import {
  KEY_MOMENT_COUNT,
  MIN_MOMENT_GAP,
  PREVIOUS_KEY_MOMENT_AVG,
  createCareer,
  drawSituations,
  momentOptions,
  sessionTrainOdds,
  trainBarParts,
  trainBucket,
  trainOdds,
  TRAIN_BAR_SEGMENTS,
} from "./engine";
import { ATTR_KEYS, type Career, type MatchReport, type Moment, type PositionId } from "./types";
import { STORY_MIN_GAP, rollStory } from "./stories";

const career = () => createCareer("Feel test", "ST", "eng", 7);

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

test("options in the same moment differ by at least 5 points, and safer has a smaller or equal reward", () => {
  const rank: Record<string, number> = { goal: 2, assist: 1, stop: 0 };
  const situations = ["penalty", "freekick", "oneonone", "runbehind", "aerial", "keypass", "defend", "gkdive", "gkstand", "gkcomeoff"];
  const attrsList = [40, 60, 75, 78, 90, 99];
  for (const situation of situations) {
    for (const attr of attrsList) {
      const c = career();
      for (const key of ATTR_KEYS) c.player.attrs[key] = attr;
      for (const opponent of [70, 95]) {
        const options = momentOptions(c, situation, opponent);
        for (let i = 0; i < options.length; i += 1) {
          for (let j = i + 1; j < options.length; j += 1) {
            assert.ok(
              Math.abs(options[i].odds - options[j].odds) >= MIN_MOMENT_GAP,
              `${situation} ${attr} vs ${opponent}: ${options[i].id}=${options[i].odds} ${options[j].id}=${options[j].odds}`,
            );
          }
        }
        const safer = [...options].sort((a, b) => b.odds - a.odds)[0];
        const riskier = [...options].sort((a, b) => a.odds - b.odds)[0];
        assert.ok((rank[safer.reward] ?? 0) <= (rank[riskier.reward] ?? 0), `${situation} safer ${safer.id} reward beats ${riskier.id}`);
      }
    }
    // Split attributes: high shooting, low passing (curl vs layoff).
    const split: Career = career();
    for (const key of ATTR_KEYS) split.player.attrs[key] = 40;
    split.player.attrs.shooting = 99;
    const fk = momentOptions(split, "freekick", 70);
    const curl = fk.find((o) => o.id === "curl")!;
    const layoff = fk.find((o) => o.id === "layoff")!;
    assert.ok(layoff.odds - curl.odds >= MIN_MOMENT_GAP);
    assert.equal(curl.reward, "goal");
    assert.equal(layoff.reward, "assist");
  }
});

test("a key match draws 4 moments without repeating a type when the pool allows it", () => {
  assert.equal(KEY_MOMENT_COUNT, 4);
  const positions: PositionId[] = ["ST", "W", "CAM", "CM", "CB", "FB", "CDM", "GK"];
  for (const position of positions) {
    for (let seed = 1; seed <= 80; seed += 1) {
      const drawn = drawSituations(position, rng(seed * 17 + position.length));
      assert.equal(drawn.length, KEY_MOMENT_COUNT, `${position} seed ${seed}`);
      const unique = new Set(drawn);
      if (position === "GK") {
        assert.ok(unique.size === 3 || unique.size === 4);
        assert.ok(unique.size >= 3);
      } else {
        assert.equal(unique.size, KEY_MOMENT_COUNT, `${position} repeated ${drawn}`);
      }
    }
  }
});

test("later matches prefer situation types that were not seen recently", () => {
  const recent = ["penalty", "freekick", "oneonone", "runbehind"];
  const counts = new Map<string, number>();
  for (let seed = 1; seed <= 120; seed += 1) {
    const drawn = drawSituations("ST", rng(seed * 31), recent);
    for (const id of drawn) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  for (const id of ["aerial", "keypass"]) {
    assert.ok((counts.get(id) ?? 0) >= 120, `${id} should appear in every draw, got ${counts.get(id)}`);
  }
  // Oldest recent types fill the remaining slots; the most recently seen should be avoided.
  assert.ok((counts.get("runbehind") ?? 0) < 40, `runbehind (most recent) got ${counts.get("runbehind")}`);
  assert.ok((counts.get("oneonone") ?? 0) < 40, `oneonone got ${counts.get("oneonone")}`);
});

test("expected key-match coins stay within 5% of the old 7-moment total", () => {
  const oldPay = 5;
  const report = {
    missed: false,
    us: 2,
    them: 1,
    goals: 1,
    assists: 1,
    rating: 8,
    tackles: 0,
    keyPasses: 0,
    saves: 0,
    errors: 0,
    dribbles: 0,
    fitness: 80,
    headline: "",
    deltas: Object.fromEntries(ATTR_KEYS.map((k) => [k, 0])),
  } as unknown as MatchReport;
  const p = 0.4;
  const oldMomentCoins = PREVIOUS_KEY_MOMENT_AVG * p * oldPay;
  const newMomentCoins = KEY_MOMENT_COUNT * p * EARN.keyMoment;
  const oldTotal = earnForReport(report, true, []) + oldMomentCoins;
  const newTotal = earnForReport(report, true, []) + newMomentCoins;
  assert.ok(Math.abs(newTotal - oldTotal) / oldTotal <= 0.05, `old ${oldTotal} new ${newTotal}`);
  // Concrete moments at the same success count as the old average * p
  const successes = 3;
  const moments = Array.from({ length: KEY_MOMENT_COUNT }, (_, i) => ({ success: i < successes })) as Moment[];
  const oldEquivalent = Array.from({ length: PREVIOUS_KEY_MOMENT_AVG }, (_, i) => ({ success: i < Math.round((successes / KEY_MOMENT_COUNT) * PREVIOUS_KEY_MOMENT_AVG) })) as Moment[];
  const got = earnForReport(report, true, moments);
  const was = 0 + (report.us > report.them ? 60 : 8) + Math.min(25, 2 * 5) + 10 + Math.round((successes / KEY_MOMENT_COUNT) * PREVIOUS_KEY_MOMENT_AVG) * oldPay;
  // Direct check: 4 * 8.75 == 7 * 5
  assert.equal(EARN.keyMoment * KEY_MOMENT_COUNT, oldPay * PREVIOUS_KEY_MOMENT_AVG);
  assert.equal(got, Math.round(earnForReport(report, true, []) + successes * EARN.keyMoment));
  void oldEquivalent;
  void was;
});

test("story cards are at most one per 4 rounds, and injury is not a story", () => {
  assert.equal(STORY_MIN_GAP, 4);
  const c = career();
  const yes = () => 0;
  for (let played = 0; played < 20; played += 1) {
    c.season.fixturesPlayed = Array.from({ length: played }, () => ({}) as never);
    const offered = rollStory(c, yes);
    if (played < 4 || played % 7 !== 4) assert.equal(offered, null, `played ${played}`);
  }
  c.season.fixturesPlayed = Array.from({ length: 4 }, () => ({}) as never);
  const first = rollStory(c, yes);
  assert.ok(first);
  c.story = first;
  c.lastStoryPlayed = 4;
  // Next eligible cadence slot would be 11; gap from 4 is 7 >= 4. At 5–10 must stay null.
  for (let played = 5; played <= 10; played += 1) {
    c.season.fixturesPlayed = Array.from({ length: played }, () => ({}) as never);
    c.story = null;
    assert.equal(rollStory(c, yes), null, `too soon at ${played}`);
  }
  // A 3-match gap is refused even if cadence were bypassed: last=8, played=11 would be ok; last=8, played=10 is not.
  c.lastStoryPlayed = 8;
  c.season.fixturesPlayed = Array.from({ length: 11 }, () => ({}) as never);
  c.story = null;
  assert.equal(rollStory(c, yes), null, "11 - 8 = 3 is under the 4-round cap");
  c.lastStoryPlayed = 7;
  assert.ok(rollStory(c, yes), "11 - 7 = 4 meets the cap and the every-7 cadence");
});

test("the training odds line matches the rolled percentages, and the 3-segment bar is shown separately under each attribute", () => {
  const c = career();
  const odds = trainOdds(c, "shooting");
  const shared = sessionTrainOdds(c);
  assert.ok(shared);
  assert.deepEqual(shared, odds);
  const parts = trainBarParts(odds);
  assert.equal(parts.reduce((n, p) => n + p.n, 0), 100);
  for (let roll = 0; roll < 100; roll += 1) {
    const bucket = trainBucket(roll, odds);
    const part = parts.find((p) => p.id === bucket);
    assert.ok(part, `roll ${roll} bucket ${bucket}`);
  }
  assert.equal(TRAIN_BAR_SEGMENTS, 3);
  const game = readFileSync(new URL("../../src/components/game/GameApp.tsx", import.meta.url), "utf8");
  const trainFn = game.slice(game.indexOf("function TrainProgressBar"), game.indexOf("function effectLines"));
  assert.match(trainFn, /TrainProgressBar/);
  assert.match(trainFn, /data-train-bar/);
  assert.match(trainFn, /data-train-odds=/);
  assert.match(trainFn, /trainBarHint/);
  assert.match(trainFn, /trainFlatBar/);
  assert.match(trainFn, /trainBarFull/);
  assert.match(trainFn, /trainHurtBar/);
  assert.match(trainFn, /answerCamp/);
  assert.match(trainFn, /answerBreak/);
  const css = readFileSync(new URL("../../src/styles.css", import.meta.url), "utf8");
  assert.match(css, /\.train-prog /);
  const i18n = readFileSync(new URL("./i18n.ts", import.meta.url), "utf8");
  assert.match(i18n, /trainBarHint: "Every session fills the bar\."/);
  assert.match(i18n, /trainBarHint: "כל אימון ממלא את הפס\."/);
  assert.match(i18n, /trainFlatBar: "No jump this time\. Bar \{r\}\/3"/);
  assert.match(i18n, /trainFlatBar: "הפעם בלי קפיצה\. הפס \{r\}\/3"/);
  assert.match(i18n, /trainBarFull: "Bar full: \{attr\} \+1"/);
  assert.match(i18n, /trainBarFull: "הפס מלא: \{attr\} ‎\+1"/);
  assert.match(i18n, /trainHurtBar: "Injured\. Bar kept\."/);
  assert.match(i18n, /trainHurtBar: "פציעה\. הפס נשמר\."/);
});
