/**
 * Same validation CI uses before npm ci. Run after any package.json change.
 */
import { execSync } from "node:child_process";

execSync("npm ci --dry-run --ignore-scripts", { stdio: "inherit" });
console.log("package-lock.json is in sync with package.json");
