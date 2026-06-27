import { describe, expect, it } from "vitest";

import { onboardingPayloadSchema } from "@/lib/validations/onboarding";

describe("onboardingPayloadSchema", () => {
  it("accepts valid payload with multiple languages", () => {
    const parsed = onboardingPayloadSchema.safeParse({
      displayName: "",
      languages: [
        { languageCode: "es", level: "beginner" },
        { languageCode: "ja", level: "intermediate" },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts display names with any characters", () => {
    const parsed = onboardingPayloadSchema.safeParse({
      displayName: "Mark!",
      languages: [{ languageCode: "es", level: "intermediate" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid age range", () => {
    const parsed = onboardingPayloadSchema.safeParse({
      displayName: "Mark",
      ageRange: "40_49",
      languages: [{ languageCode: "es", level: "proficient" }],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty languages array", () => {
    const parsed = onboardingPayloadSchema.safeParse({
      displayName: "Mark",
      languages: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid language level", () => {
    const parsed = onboardingPayloadSchema.safeParse({
      displayName: "Mark",
      languages: [{ languageCode: "es", level: "fluent" }],
    });
    expect(parsed.success).toBe(false);
  });
});
