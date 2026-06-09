import { describe, expect, it } from "vitest";

import { isLightOnlyPath } from "@/lib/theme/light-only-paths";

describe("isLightOnlyPath", () => {
  it("forces light mode on marketing home", () => {
    expect(isLightOnlyPath("/")).toBe(true);
  });

  it("allows dark mode on other routes", () => {
    expect(isLightOnlyPath("/login")).toBe(false);
    expect(isLightOnlyPath("/app/journal")).toBe(false);
    expect(isLightOnlyPath("/onboarding")).toBe(false);
  });
});
