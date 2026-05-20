/**
 * Refresh package-lock.json without touching node_modules (safe while dev server runs).
 * On Windows, also run lockfile:sync:linux before pushing if CI still complains.
 */
import { execSync } from "node:child_process";

execSync("npm install --package-lock-only --ignore-scripts", { stdio: "inherit" });
console.log(
  "Updated package-lock.json — commit it. Then run: npm run lockfile:check",
);
