import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { FONTS, OUTPUT } from "./gen-licenses.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(OUTPUT, "utf8"));

test("the notices list every production dependency (run `npm run licenses` after changing them)", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const listed = new Set(data.packages.map((p) => p.name));
  const missing = Object.keys(pkg.dependencies ?? {}).filter((name) => !listed.has(name));
  assert.deepEqual(missing, []);
  const lock = JSON.parse(readFileSync(join(ROOT, "package-lock.json"), "utf8"));
  for (const name of Object.keys(pkg.devDependencies ?? {})) {
    if (lock.packages[`node_modules/${name}`]?.dev) assert.equal(listed.has(name), false, `${name} is dev-only`);
  }
});

test("the three bundled fonts carry their OFL 1.1 copyright", () => {
  assert.deepEqual(data.fonts.map((f) => f.name), FONTS.map((f) => f.name));
  for (const font of data.fonts) {
    assert.equal(font.license, "OFL-1.1");
    assert.match(font.copyright[0], /^Copyright \d{4} The .+ Project Authors/);
  }
  assert.match(data.texts["OFL-1.1"], /SIL OPEN FONT LICENSE Version 1\.1/);
});

test("every listed license has its full text", () => {
  for (const p of data.packages) {
    for (const id of p.license.replace(/[()]/g, "").split(/\s+(?:AND|OR)\s+/)) {
      assert.ok(data.texts[id], `${p.name}: no text for ${id}`);
    }
  }
});
