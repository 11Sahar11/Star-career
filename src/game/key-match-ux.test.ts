import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { ACTION_MS, RESULT_HOLD_MS, RESULT_OVERLAY_MS, TENSION_MS, resultCardMode } from "../components/game/pitch-timing.ts";
import { KEY_MOMENT_COUNT } from "./engine";

const game = readFileSync(new URL("../components/game/GameApp.tsx", import.meta.url), "utf8");
const i18n = readFileSync(new URL("./i18n.ts", import.meta.url), "utf8");

test("key-match timings fit in 5 seconds after a tap, with a 1.2s result overlay", () => {
  assert.equal(KEY_MOMENT_COUNT, 4);
  assert.equal(TENSION_MS, 300);
  assert.equal(ACTION_MS, 1500);
  assert.equal(RESULT_HOLD_MS, 400);
  assert.equal(RESULT_OVERLAY_MS, 1200);
  assert.ok(TENSION_MS + ACTION_MS + RESULT_HOLD_MS + RESULT_OVERLAY_MS <= 5000);
});

test("the result card auto-advances except on retry or the last moment", () => {
  assert.equal(resultCardMode(false, false), "auto");
  assert.equal(resultCardMode(true, false), "finish");
  assert.equal(resultCardMode(false, true), "retry");
  assert.equal(resultCardMode(true, true), "retry");
  const board = game.slice(game.indexOf("function BigMatchScreen"), game.indexOf("function MatchScreen"));
  assert.match(board, /data-result-overlay=\{cardMode\}/);
  assert.match(board, /RESULT_OVERLAY_MS/);
  assert.match(board, /cardMode === "auto" \? \(\) => setReveal\(null\)/);
  assert.match(board, /tr\("mo.finish"\)/);
  assert.match(board, /cardMode === "finish" || cardMode === "retry"/);
  assert.match(board, /isLastMoment \? tr\("mo.finish"\) : tr\("pb.continue"\)/);
  assert.match(board, /data-moment-counter/);
  assert.match(board, /tr\("mo.counter"/);
  assert.match(i18n, /"mo.counter": "Moment \{i\}\/\{n\}"/);
  assert.match(i18n, /"mo.counter": "רגע \{i\}\/\{n\}"/);
});
