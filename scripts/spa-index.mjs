// The SPA prerender writes dist/client/_shell.html. Capacitor loads index.html.
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const shell = join(root, "dist/client/_shell.html");
const index = join(root, "dist/client/index.html");
if (existsSync(index)) {
  console.log("[spa-index] dist/client/index.html already present");
} else if (existsSync(shell)) {
  copyFileSync(shell, index);
  console.log("[spa-index] copied _shell.html to index.html");
} else {
  console.error("[spa-index] missing dist/client/index.html");
  process.exit(1);
}
