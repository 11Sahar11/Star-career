import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { markStreakPlayed, readStreak } from "./save";

// A fake device: localStorage in memory and a clock moved day by day.
const store = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key),
};
const RealDate = Date;
const start = new RealDate(2026, 10, 1, 12).getTime();
let offset = 0;
globalThis.Date = class extends RealDate {
  constructor(...args: ConstructorParameters<typeof Date>) {
    if (args.length) super(...args);
    else super(start + offset);
  }
  static now() {
    return start + offset;
  }
} as DateConstructor;
const day = (n: number) => {
  offset = n * 86400000;
};
const key = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

beforeEach(() => {
  store.clear();
  day(0);
});

test("a new player has no streak and one freeze; a season of today's race starts it once a day", () => {
  assert.deepEqual([readStreak().n, readStreak().freezes, readStreak().playedToday], [0, 1, false]);
  assert.equal(markStreakPlayed().n, 1);
  assert.equal(markStreakPlayed().n, 1);
  assert.equal(readStreak().playedToday, true);
});

test("7 days in a row is a milestone and earns a second freeze", () => {
  let state = markStreakPlayed();
  for (let d = 1; d <= 6; d++) {
    day(d);
    state = markStreakPlayed();
  }
  assert.equal(state.n, 7);
  assert.equal(state.milestone, 7);
  assert.equal(state.freezes, 2);
});

test("opening the app is not playing: the streak is kept but today is still to play", () => {
  markStreakPlayed();
  day(1);
  const state = readStreak();
  assert.equal(state.n, 1);
  assert.equal(state.playedToday, false);
});

test("a missed day spends a freeze; more missed days than freezes ends the streak", () => {
  markStreakPlayed();
  day(1);
  markStreakPlayed();
  day(3);
  const kept = readStreak();
  assert.deepEqual([kept.n, kept.freezesUsed, kept.freezes], [2, 1, 0]);
  assert.equal(markStreakPlayed().n, 3);
  day(5);
  assert.equal(readStreak().n, 0);
  const restarted = markStreakPlayed();
  assert.deepEqual([restarted.n, restarted.best], [1, 3]);
});

test("a v1 save (counted on app open) keeps its count, and today still needs a race", () => {
  store.set("star-streak", JSON.stringify({ date: key(new Date()), n: 5 }));
  const state = readStreak();
  assert.deepEqual([state.n, state.playedToday], [5, false]);
  assert.equal(markStreakPlayed().n, 6);
});
