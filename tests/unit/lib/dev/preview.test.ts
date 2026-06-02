import { afterEach, describe, expect, it } from "vitest";

import { isDevPreviewParam } from "@/lib/dev/preview";

describe("isDevPreviewParam", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("matches in development", () => {
    process.env.NODE_ENV = "development";
    expect(isDevPreviewParam("onboarding", "onboarding")).toBe(true);
    expect(isDevPreviewParam("marketing", "onboarding")).toBe(false);
  });

  it("never matches outside development", () => {
    process.env.NODE_ENV = "production";
    expect(isDevPreviewParam("onboarding", "onboarding")).toBe(false);
  });
});
