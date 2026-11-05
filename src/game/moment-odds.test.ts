import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createCareer,
  keyFixtureIds,
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
  assert.equal(momentOdds(60, 70, 0.78), 78);
  assert.equal(momentOdds(60, 70, 0.4), 40);
  assert.equal(momentOdds(60, 70, 0.08), 8);
  assert.equal(momentOdds(90, momentOpponent(94.2), 0.4), 62);
  assert.equal(momentOdds(90, momentOpponent(94.2), 0.78), 90);
  assert.equal(momentOdds(90, momentOpponent(94.2), 0.08, 35), 18);
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
    assert.ok(pen <= 92 && shot <= 85 && curl <= 35);
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
