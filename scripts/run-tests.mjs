// Runs every test suite even when an earlier one fails; exits non-zero if any failed.
import { spawnSync } from "node:child_process";

const suites = [
  ["scripts", ["--test", "scripts/**/*.test.mjs"]],
  [
    "app-data/auth",
    [
      "--experimental-strip-types",
      "--test",
      "src/lib/app-data/app-data.test.ts",
      "src/lib/app-data/readiness-schedule.test.ts",
      "src/lib/auth/gate-identity.test.ts",
      "src/lib/auth/sign-in-gate.test.ts",
      "src/lib/preview-path-prefix.test.ts",
    ],
  ],
];

const results = suites.map(([name, args]) => {
  const { status } = spawnSync(process.execPath, args, { stdio: "inherit" });
  return [name, status ?? 1];
});
for (const [name, status] of results) console.log(`[test] ${name}: ${status === 0 ? "pass" : `FAIL (exit ${status})`}`);
process.exit(results.some(([, status]) => status !== 0) ? 1 : 0);
