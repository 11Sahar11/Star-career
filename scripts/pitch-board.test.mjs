import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { pitchFrame, TENSION_MS, ACTION_MS } from "../src/components/game/pitch-timing.ts";

test("tension holds the action for 500ms without revealing an outcome", () => {
  assert.equal(TENSION_MS, 500);
  for (const elapsed of [0, 100, 499]) {
    assert.equal(pitchFrame(elapsed).progress, 0);
    assert.equal(pitchFrame(elapsed).tension, true);
  }
  assert.equal(pitchFrame(500).tension, false);
  assert.equal(pitchFrame(500).progress, 0);
  assert.equal(pitchFrame(500 + ACTION_MS / 2).progress, 0.5);
});
test("camera gently zooms during tension and returns by the last frame", () => {
  assert.equal(pitchFrame(0).zoom, 1);
  assert.equal(pitchFrame(500).zoom, 1.045);
  assert.equal(pitchFrame(500 + ACTION_MS).zoom, 1);
  for (let ms = 0; ms <= 3500; ms += 10) {
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
