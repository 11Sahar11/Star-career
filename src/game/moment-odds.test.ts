import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createCareer,
  FREE_KICK_BASE,
  FREE_KICK_CEILING,
  FREE_KICK_PER_POINT,
  keyFixtureIds,
  MOMENT_QUALITY_PER_POINT,
  momentOdds,
  momentOpponent,
  momentOptions,
  playStep,
  resolveMoment,
  retryMoment,
} from "./engine";
import { ATTR_KEYS, type PendingMatch } from "./types";

const situations = [
  "penalty",
  "freekick",
  "oneonone",
  "runbehind",
  "aerial",
  "keypass",
  "defend",
  "gkdive",
  "gkstand",
  "gkcomeoff",
];
const career = () => createCareer("Odds test", "ST", "eng", 42);

test("football baselines, improvement and elite opposition regression", () => {
  assert.equal(MOMENT_QUALITY_PER_POINT, 0.045);
  assert.equal(FREE_KICK_PER_POINT, 0.051);
  assert.equal(FREE_KICK_BASE, 0.15);
  assert.equal(FREE_KICK_CEILING, 50);
  assert.equal(momentOdds(60, 70, 0.78), 78);
  assert.equal(momentOdds(60, 70, 0.4), 40);
  assert.equal(momentOdds(60, 70, 0.08), 8);
  assert.equal(momentOdds(90, momentOpponent(94.2), 0.4), 62);
  assert.equal(momentOdds(90, momentOpponent(94.2), 0.78), 90);
  assert.equal(momentOdds(90, momentOpponent(94.2), 0.08, 35), 18);
  // curl: logit(0.15) + 18×0.051 ≈ -0.82 → 31% (was 16% at base 0.08 / slope 0.045 / cap 35)
  assert.equal(momentOdds(78, 70, FREE_KICK_BASE, FREE_KICK_CEILING, FREE_KICK_PER_POINT), 31);
  assert.equal(momentOdds(60, 70, FREE_KICK_BASE, FREE_KICK_CEILING, FREE_KICK_PER_POINT), 15);
  for (const situation of situations) {
    let previous = 0;
    for (const attr of [40, 60, 75, 90]) {
      const c = career();
      for (const key of ATTR_KEYS) c.player.attrs[key] = attr;
      const options = momentOptions(c, situation, 70);
      assert.ok(options.every((o) => Number.isInteger(o.odds) && o.odds >= 5 && o.odds <= 92));
      assert.ok(options[0].odds > previous, situation);
      previous = options[0].odds;
      assert.ok(momentOptions(c, situation, 95).every((o, i) => o.odds <= options[i].odds));
    }
  }
});

test("distance hierarchy and caps survive camp, gear and extreme ratings", () => {
  const c = career();
  for (const key of ATTR_KEYS) c.player.attrs[key] = 99;
  c.keyCampBonus = 12;
  c.gear = { kick: "gold" };
  for (const opponent of [-999, 70, 999]) {
    const pen = momentOptions(c, "penalty", opponent)[0].odds;
    const shot = momentOptions(c, "oneonone", opponent)[1].odds;
    const curl = momentOptions(c, "freekick", opponent)[0].odds;
    assert.ok(pen > shot && shot > curl);
    assert.ok(pen <= 92 && shot <= 85 && curl <= 50);
  }
});

test("gear/training chips measure the same final capped odds", () => {
  const c = career();
  c.player.attrs.shooting = 70;
  c.gear = { kick: "gold" };
  c.keyGain = { shooting: 5 };
  c.keyCampBonus = 6;
  const option = momentOptions(c, "oneonone", 70)[1];
  const bare = structuredClone(c);
  bare.gear = {};
  assert.equal(option.gear, option.odds - momentOptions(bare, "oneonone", 70)[1].odds);
  const earlier = structuredClone(c);
  earlier.player.attrs.shooting -= 5;
  assert.equal(option.gain, option.odds - momentOptions(earlier, "oneonone", 70)[1].odds);
});

test("fitness, form, morale and difficulty do not secretly change moment odds", () => {
  const c = career();
  const before = momentOptions(c, "oneonone", 70);
  c.player.fitness = 24;
  c.player.form = 8;
  c.player.morale = 5;
  c.difficulty = "hard";
  assert.deepEqual(momentOptions(c, "oneonone", 70), before);
});

function random(seed: number) {
  const state = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

test("displayed stored odds are the exact deterministic roll threshold, including saved matches", () => {
  let c = career();
  c.screen = "run";
  c.season.cursor = c.season.fixtures.findIndex((f) =>
    keyFixtureIds(c.season, c.clubId).includes(f.id),
  );
  c = playStep(c);
  assert.ok(c.pending);
  for (const odds of [5, 8, 18, 40, 62, 78, 92]) {
    let wins = 0;
    for (let seed = 1; seed <= 10000; seed++) {
      const pending: PendingMatch = {
        ...c.pending,
        seed,
        moments: [
          {
            ...c.pending.moments[0],
            options: [{ ...c.pending.moments[0].options[0], odds }],
            picked: undefined,
            success: undefined,
          },
        ],
      };
      const option = pending.moments[0].options[0];
      const result = resolveMoment({ ...c, pending }, 0, option.id);
      const success = result.pending!.moments[0].success;
      assert.equal(success, random(hash(`${seed}|0|${option.id}`)) * 100 < odds);
      if (success) wins++;
    }
    assert.ok(Math.abs(wins / 100 - odds) < 2, `frequency ${wins / 100} vs ${odds}`);
  }
  const m = c.pending.moments[0];
  const pending: PendingMatch = {
    ...c.pending,
    rngState: 12345,
    moments: [{ ...m, picked: m.options[0].id, success: false }],
  };
  assert.equal(
    retryMoment({ ...c, pending }, 0).pending!.moments[0].success,
    random(12345) * 100 < m.options[0].odds,
  );
  assert.equal(resolveMoment({ ...c, pending }, 0, m.options[0].id).pending, pending);
});

function curlCareer(shooting: number) {
  const c = career();
  for (const key of ATTR_KEYS) c.player.attrs[key] = shooting;
  c.player.attrs.shooting = shooting;
  c.gear = {};
  c.keyCampBonus = 0;
  c.keyGain = {};
  return c;
}

function curlOdds(shooting: number, opponent = 70) {
  const option = momentOptions(curlCareer(shooting), "freekick", opponent)[0];
  assert.equal(option.id, "curl");
  return option;
}

test("free-kick curl: 78 vs 70 is 31%, and the card percentage is the engine roll", () => {
  const option = curlOdds(78, 70);
  assert.equal(option.odds, 31);
  assert.equal(option.odds, momentOdds(78, 70, FREE_KICK_BASE, FREE_KICK_CEILING, FREE_KICK_PER_POINT));
  let c = curlCareer(78);
  c.screen = "run";
  c.season.cursor = c.season.fixtures.findIndex((f) => keyFixtureIds(c.season, c.clubId).includes(f.id));
  c = playStep(c);
  assert.ok(c.pending);
  for (const odds of [option.odds, 50, 5]) {
    for (let seed = 1; seed <= 200; seed++) {
      const pending: PendingMatch = {
        ...c.pending,
        seed,
        moments: [
          {
            ...c.pending.moments[0],
            options: [{ ...option, odds }],
            picked: undefined,
            success: undefined,
          },
        ],
      };
      const success = resolveMoment({ ...c, pending }, 0, option.id).pending!.moments[0].success;
      assert.equal(success, random(hash(`${seed}|0|${option.id}`)) * 100 < odds);
    }
  }
});

test("free-kick curl floor, cap and MAX use the same stored odds the engine rolls", () => {
  const floor = curlOdds(1, 999);
  assert.equal(floor.odds, 5);
  const maxed = curlOdds(99, 70);
  assert.equal(maxed.odds, 50);
  const camped = curlCareer(99);
  camped.keyCampBonus = 12;
  camped.gear = { kick: "gold" };
  const capped = momentOptions(camped, "freekick", 70)[0];
  assert.equal(capped.id, "curl");
  assert.equal(capped.odds, 50);
  let c = curlCareer(99);
  c.screen = "run";
  c.season.cursor = c.season.fixtures.findIndex((f) => keyFixtureIds(c.season, c.clubId).includes(f.id));
  c = playStep(c);
  assert.ok(c.pending);
  for (const option of [floor, maxed, capped]) {
    const pending: PendingMatch = {
      ...c.pending,
      seed: 7,
      moments: [
        {
          ...c.pending.moments[0],
          options: [option],
          picked: undefined,
          success: undefined,
        },
      ],
    };
    const success = resolveMoment({ ...c, pending }, 0, option.id).pending!.moments[0].success;
    assert.equal(success, random(hash(`7|0|${option.id}`)) * 100 < option.odds);
  }
});

// Snapshot of every non-curl option on main before this change (attrs 40/60/75/78/90/99, opponents 70 and 95).
const OTHER_ODDS: Record<string, Record<number, Record<number, [string, number][]>>> = {
  penalty: {40:{70:[["pen",59],["power",54]],95:[["pen",48],["power",42]]},60:{70:[["pen",78],["power",74]],95:[["pen",69],["power",64]]},75:{70:[["pen",87],["power",85]],95:[["pen",82],["power",78]]},78:{70:[["pen",89],["power",86]],95:[["pen",84],["power",80]]},90:{70:[["pen",92],["power",92]],95:[["pen",90],["power",88]]},99:{70:[["pen",92],["power",92]],95:[["pen",92],["power",91]]}},
  freekick: {40:{70:[["layoff",15]],95:[["layoff",10]]},60:{70:[["layoff",30]],95:[["layoff",21]]},75:{70:[["layoff",46]],95:[["layoff",35]]},78:{70:[["layoff",49]],95:[["layoff",38]]},90:{70:[["layoff",62]],95:[["layoff",51]]},99:{70:[["layoff",71]],95:[["layoff",61]]}},
  oneonone: {40:{70:[["dribble",18],["shoot",21]],95:[["dribble",12],["shoot",15]]},60:{70:[["dribble",35],["shoot",40]],95:[["dribble",26],["shoot",30]]},75:{70:[["dribble",51],["shoot",57]],95:[["dribble",40],["shoot",46]]},78:{70:[["dribble",55],["shoot",60]],95:[["dribble",44],["shoot",49]]},90:{70:[["dribble",68],["shoot",72]],95:[["dribble",57],["shoot",62]]},99:{70:[["dribble",76],["shoot",79]],95:[["dribble",67],["shoot",71]]}},
  runbehind: {40:{70:[["sprint",16],["pass",33]],95:[["sprint",11],["pass",24]]},60:{70:[["sprint",32],["pass",55]],95:[["sprint",23],["pass",44]]},75:{70:[["sprint",48],["pass",71]],95:[["sprint",37],["pass",60]]},78:{70:[["sprint",51],["pass",73]],95:[["sprint",40],["pass",64]]},90:{70:[["sprint",64],["pass",83]],95:[["sprint",54],["pass",75]]},99:{70:[["sprint",73],["pass",88]],95:[["sprint",63],["pass",82]]}},
  aerial: {40:{70:[["header",10],["knock",18]],95:[["header",7],["knock",12]]},60:{70:[["header",22],["knock",35]],95:[["header",15],["knock",26]]},75:{70:[["header",36],["knock",51]],95:[["header",26],["knock",40]]},78:{70:[["header",39],["knock",55]],95:[["header",29],["knock",44]]},90:{70:[["header",52],["knock",68]],95:[["header",41],["knock",57]]},99:{70:[["header",62],["knock",76]],95:[["header",51],["knock",67]]}},
  keypass: {40:{70:[["through",15],["carry",8]],95:[["through",10],["carry",5]]},60:{70:[["through",30],["carry",18]],95:[["through",21],["carry",12]]},75:{70:[["through",46],["carry",30]],95:[["through",35],["carry",22]]},78:{70:[["through",49],["carry",33]],95:[["through",38],["carry",24]]},90:{70:[["through",62],["carry",46]],95:[["through",51],["carry",35]]},99:{70:[["through",71],["carry",56]],95:[["through",61],["carry",45]]}},
  defend: {40:{70:[["tackle",33],["block",38],["track",25]],95:[["tackle",24],["block",28],["track",17]]},60:{70:[["tackle",55],["block",60],["track",45]],95:[["tackle",44],["block",49],["track",34]]},75:{70:[["tackle",71],["block",75],["track",62]],95:[["tackle",60],["block",65],["track",51]]},78:{70:[["tackle",73],["block",77],["track",65]],95:[["tackle",64],["block",68],["track",54]]},90:{70:[["tackle",83],["block",85],["track",76]],95:[["tackle",75],["block",79],["track",67]]},99:{70:[["tackle",88],["block",90],["track",83]],95:[["tackle",82],["block",85],["track",75]]}},
  gkdive: {40:{70:[["dive",43],["stand",29]],95:[["dive",32],["stand",21]]},60:{70:[["dive",65],["stand",50]],95:[["dive",54],["stand",39]]},75:{70:[["dive",78],["stand",66]],95:[["dive",70],["stand",56]]},78:{70:[["dive",81],["stand",69]],95:[["dive",73],["stand",59]]},90:{70:[["dive",88],["stand",79]],95:[["dive",82],["stand",71]]},99:{70:[["dive",91],["stand",85]],95:[["dive",87],["stand",79]]}},
  gkstand: {40:{70:[["stand",38],["dive",29]],95:[["stand",28],["dive",21]]},60:{70:[["stand",60],["dive",50]],95:[["stand",49],["dive",39]]},75:{70:[["stand",75],["dive",66]],95:[["stand",65],["dive",56]]},78:{70:[["stand",77],["dive",69]],95:[["stand",68],["dive",59]]},90:{70:[["stand",85],["dive",79]],95:[["stand",79],["dive",71]]},99:{70:[["stand",90],["dive",85]],95:[["stand",85],["dive",79]]}},
  gkcomeoff: {40:{70:[["rush",33],["sweep",38]],95:[["rush",24],["sweep",28]]},60:{70:[["rush",55],["sweep",60]],95:[["rush",44],["sweep",49]]},75:{70:[["rush",71],["sweep",75]],95:[["rush",60],["sweep",65]]},78:{70:[["rush",73],["sweep",77]],95:[["rush",64],["sweep",68]]},90:{70:[["rush",83],["sweep",85]],95:[["rush",75],["sweep",79]]},99:{70:[["rush",88],["sweep",90]],95:[["rush",82],["sweep",85]]}},
};

test("no behavior change for any action type except free-kick curl", () => {
  assert.equal(momentOdds(78, 70, 0.4), momentOdds(78, 70, 0.4, 92, MOMENT_QUALITY_PER_POINT));
  for (const situation of situations) {
    for (const attr of [40, 60, 75, 78, 90, 99]) {
      const c = career();
      for (const key of ATTR_KEYS) c.player.attrs[key] = attr;
      for (const opponent of [70, 95]) {
        const got = momentOptions(c, situation, opponent)
          .filter((o) => o.id !== "curl")
          .map((o) => [o.id, o.odds]);
        assert.deepEqual(got, OTHER_ODDS[situation][attr][opponent], `${situation} attr ${attr} vs ${opponent}`);
      }
    }
  }
});
