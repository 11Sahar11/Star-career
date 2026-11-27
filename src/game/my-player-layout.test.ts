import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("../../src/styles.css", import.meta.url), "utf8");
const game = readFileSync(new URL("../../src/components/game/GameApp.tsx", import.meta.url), "utf8");

function rule(src: string, selector: string) {
  const match = src.match(new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{([^}]+)\\}"));
  assert.ok(match, `missing CSS rule ${selector}`);
  return match[1];
}

function zIndex(body: string) {
  const match = body.match(/z-index:\s*(\d+)/);
  assert.ok(match, `no z-index in ${body}`);
  return Number(match[1]);
}

test("My Player character button does not stack over gear price buttons", () => {
  const gearZ = zIndex(rule(css, ".gear-cell"));
  const lookZ = zIndex(rule(css, ".look-open.myplayer-stage"));
  assert.ok(gearZ > lookZ, `gear-cell z-index ${gearZ} should be above look-open ${lookZ}`);
  assert.match(rule(css, ".gear-cell"), /position:\s*relative/);
  assert.match(game, /className="gear-price"/);
  assert.match(game, /data-look-open/);
  const lookBtn = game.slice(game.indexOf("look-open myplayer-stage"), game.indexOf("look-badge"));
  assert.match(lookBtn, /setLook\(true\)/);
  assert.match(lookBtn, /gridColumn: 2/);
  assert.match(lookBtn, /data-look-open/);
});
