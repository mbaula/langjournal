/**
 * Regenerate package-lock.json the same way GitHub Actions does (Linux resolution).
 * Use on Windows when lockfile:check fails after lockfile:sync. Requires Docker.
 */
import { execSync } from "node:child_process";
import { cwd } from "node:process";

const dir = cwd().replace(/\\/g, "/");
const mount = `${dir}:/app`;

execSync(
  `docker run --rm -v "${mount}" -w /app node:22-bookworm-slim npm install --package-lock-only --ignore-scripts`,
  { stdio: "inherit", shell: true },
);
console.log("Updated package-lock.json (Linux) — commit it, then: npm run lockfile:check");
