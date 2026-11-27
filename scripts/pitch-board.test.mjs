import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { pitchFrame, TENSION_MS, ACTION_MS, RESULT_HOLD_MS, RESULT_OVERLAY_MS, resultCardMode } from "../src/components/game/pitch-timing.ts";

test("tension holds the action for 300ms without revealing an outcome", () => {
  assert.equal(TENSION_MS, 300);
  assert.equal(ACTION_MS, 1500);
  assert.equal(RESULT_HOLD_MS, 400);
  for (const elapsed of [0, 100, 299]) {
    assert.equal(pitchFrame(elapsed).progress, 0);
    assert.equal(pitchFrame(elapsed).tension, true);
  }
  assert.equal(pitchFrame(300).tension, false);
  assert.equal(pitchFrame(300).progress, 0);
  assert.equal(pitchFrame(300 + ACTION_MS / 2).progress, 0.5);
});
test("camera gently zooms during tension and returns by the last frame", () => {
  assert.equal(pitchFrame(0).zoom, 1);
  assert.equal(pitchFrame(300).zoom, 1.045);
  assert.equal(pitchFrame(300 + ACTION_MS).zoom, 1);
  for (let ms = 0; ms <= 2500; ms += 10) {
    const frame = pitchFrame(ms);
    assert.ok(frame.zoom >= 1 && frame.zoom <= 1.045);
    assert.ok(frame.progress >= 0 && frame.progress <= 1);
  }
});
test("reduced motion bypasses tension, movement and zoom", () => {
  for (const ms of [0, 250, 500, 1500, 3000])
    assert.deepEqual(pitchFrame(ms, true), { progress: 1, tension: false, zoom: 1 });
});
test("skip stops the frame loop and can complete only once; accessible button is wired", () => {
  const source = readFileSync(
    new URL("../src/components/game/PitchBoard.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /if \(completed.current\) return;/);
  assert.match(source, /if \(!play \|\| completed.current\) return;/);
  assert.match(
    source,
    /completed.current = true;\s*setElapsed\(TENSION_MS \+ ACTION_MS\);\s*done.current\(\);/,
  );
  assert.match(source, /className="pb-skip" onClick=\{skip\} aria-label=\{skipLabel\}/);
});

test("result overlay lasts 1.2s and auto-advances except retry or the last moment", () => {
  assert.equal(RESULT_OVERLAY_MS, 1200);
  assert.equal(resultCardMode(false, false), "auto");
  assert.equal(resultCardMode(true, false), "finish");
  assert.equal(resultCardMode(false, true), "retry");
  assert.equal(resultCardMode(true, true), "retry");
  const afterTap = TENSION_MS + ACTION_MS + RESULT_HOLD_MS + RESULT_OVERLAY_MS;
  assert.ok(afterTap <= 5000, `moment after tap is ${afterTap}ms`);
});
