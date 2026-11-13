import assert from "node:assert/strict";
import { test } from "node:test";
import { KV_KEYS, planKvMigration } from "./kv.ts";

const empty = () => Object.fromEntries(KV_KEYS.map((key) => [key, null]));

test("the first hydrate copies localStorage into the durable store", () => {
  const local = { ...empty(), "kochav-career-v10": "{\"version\":10}", "star-lang": "he" };
  const plan = planKvMigration({ migrated: false, local, durable: empty() });
  assert.equal(plan.durable["kochav-career-v10"], "{\"version\":10}");
  assert.equal(plan.local["star-lang"], "he");
  assert.equal(plan.durable["star-streak"], null);
});

test("after migration the durable copy wins, including a career the WebView forgot", () => {
  const plan = planKvMigration({
    migrated: true,
    local: empty(),
    durable: { ...empty(), "kochav-career-v10": "{\"version\":10}", "star-economy-v1": "{\"removeAds\":{\"owned\":true}}" },
  });
  assert.equal(plan.local["kochav-career-v10"], "{\"version\":10}");
  assert.match(plan.local["star-economy-v1"] ?? "", /removeAds/);
});

test("a deleted durable key is not resurrected from a stale localStorage value", () => {
  const plan = planKvMigration({
    migrated: true,
    local: { ...empty(), "kochav-career-v10": "{\"version\":10}" },
    durable: empty(),
  });
  assert.equal(plan.local["kochav-career-v10"], null);
  assert.equal(plan.durable["kochav-career-v10"], null);
});
