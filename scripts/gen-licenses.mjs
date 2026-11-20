#!/usr/bin/env node
/**
 * Writes src/game/licenses.generated.json for the /licenses page: every
 * production npm package installed from package-lock.json (dev-only packages
 * excluded) with its license and copyright line, the full text of each license
 * type once, and the three bundled fonts in public/fonts (SIL OFL 1.1).
 *
 * Run after changing dependencies:  npm run licenses
 * scripts/gen-licenses.test.mjs fails when a dependency is missing from the file.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const OUTPUT = join(ROOT, "src/game/licenses.generated.json");

/** Bundled fonts: not npm packages, so listed by hand. Copyright comes from the shipped OFL file. */
export const FONTS = [
  { name: "Heebo", file: "public/fonts/heebo-var.woff", notice: "public/fonts/OFL-Heebo.txt" },
  { name: "Oswald", file: "public/fonts/oswald-var.woff", notice: "public/fonts/OFL-Oswald.txt" },
  { name: "Noto Sans Hebrew", file: "public/fonts/hebrew-cond-bold.woff", notice: "public/fonts/OFL-NotoSansHebrew.txt" },
];

const LICENSE_FILE = /^(licen[cs]e|copying)(\.(md|txt|markdown))?$/i;

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function licenseText(dir) {
  try {
    const file = readdirSync(dir).find((name) => LICENSE_FILE.test(name));
    return file ? readFileSync(join(dir, file), "utf8").replace(/\r\n/g, "\n").trim() : "";
  } catch {
    return "";
  }
}

function copyrightLines(text) {
  return [...new Set(text.split("\n").map((l) => l.trim()).filter((l) => /^(copyright\b|\(c\)|©)/i.test(l) && !/copyright (notice|holder|owner|law|license|statement)/i.test(l)))].slice(0, 3);
}

function repoUrl(pkg) {
  const repo = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
  if (!repo) return pkg.homepage ?? "";
  return repo
    .replace(/^git\+/, "")
    .replace(/\.git$/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/^github:/, "https://github.com/")
    .replace(/^(?!https?:)([\w.-]+\/[\w.-]+)$/, "https://github.com/$1");
}

/** Production packages from the lockfile that are installed here. */
export function productionPackages(root = ROOT) {
  const lock = readJson(join(root, "package-lock.json"));
  const out = new Map();
  for (const [path, meta] of Object.entries(lock.packages ?? {})) {
    if (!path.includes("node_modules/") || meta.dev || meta.devOptional) continue;
    const dir = join(root, path);
    if (!existsSync(join(dir, "package.json"))) continue; // an optional binary for another platform
    const pkg = readJson(join(dir, "package.json"));
    const name = pkg.name ?? path.split("node_modules/").pop();
    const key = `${name}@${pkg.version}`;
    if (out.has(key)) continue;
    const text = licenseText(dir);
    const license = typeof pkg.license === "string" ? pkg.license : (pkg.license?.type ?? meta.license ?? "UNKNOWN");
    out.set(key, { name, version: pkg.version, license, copyright: copyrightLines(text), url: repoUrl(pkg), text });
  }
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
}

export function buildLicenses(root = ROOT) {
  const all = productionPackages(root);
  /** One full text per license id, from the first package that ships it (copyright lines removed). */
  const texts = {};
  for (const p of all) {
    if (texts[p.license] || !p.text) continue;
    texts[p.license] = p.text
      .split("\n")
      .filter((l) => !/^\s*(copyright\b|\(c\)|©)/i.test(l))
      .join("\n")
      .replace(/^\n+/, "")
      .trim();
  }
  const packages = all.map(({ text: _text, ...rest }) => rest);
  const fonts = FONTS.map((font) => {
    const notice = readFileSync(join(root, font.notice), "utf8").replace(/\r\n/g, "\n");
    return { name: font.name, license: "OFL-1.1", copyright: copyrightLines(notice), notice: `/${font.notice.replace(/^public\//, "")}` };
  });
  if (!texts["OFL-1.1"]) {
    const notice = readFileSync(join(root, FONTS[0].notice), "utf8").replace(/\r\n/g, "\n");
    texts["OFL-1.1"] = notice.slice(notice.indexOf("-----")).trim();
  }
  return { fonts, packages, texts };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const data = buildLicenses();
  writeFileSync(OUTPUT, `${JSON.stringify(data, null, 1)}\n`);
  console.log(`[licenses] ${data.packages.length} packages, ${data.fonts.length} fonts, ${Object.keys(data.texts).length} license texts -> ${OUTPUT}`);
}
