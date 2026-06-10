import { describe, expect, it } from "vitest";

import {
  isLightOnlyPath,
  normalizePathname,
} from "@/lib/theme/light-only-paths";

describe("normalizePathname", () => {
  it("strips trailing slashes", () => {
    expect(normalizePathname("/onboarding/")).toBe("/onboarding");
  });

  it("keeps root as /", () => {
    expect(normalizePathname("/")).toBe("/");
  });

  it("does not treat empty path as home", () => {
    expect(isLightOnlyPath("")).toBe(false);
    expect(isLightOnlyPath(null)).toBe(false);
  });
});

describe("isLightOnlyPath", () => {
  it("forces light mode on marketing home, login, and onboarding", () => {
    expect(isLightOnlyPath("/")).toBe(true);
    expect(isLightOnlyPath("/login")).toBe(true);
    expect(isLightOnlyPath("/login/")).toBe(true);
    expect(isLightOnlyPath("/onboarding")).toBe(true);
    expect(isLightOnlyPath("/onboarding/")).toBe(true);
  });

  it("allows dark mode on app routes", () => {
    expect(isLightOnlyPath("/app/journal")).toBe(false);
  });
});
