import { afterEach, describe, expect, it } from "vitest";

import {
  getTallyFeedbackFormId,
  isTallyFeedbackConfigured,
} from "@/lib/feedback/tally";

const originalEnv = process.env.NEXT_PUBLIC_TALLY_FEEDBACK_URL;

afterEach(() => {
  if (originalEnv === undefined) {
    delete process.env.NEXT_PUBLIC_TALLY_FEEDBACK_URL;
  } else {
    process.env.NEXT_PUBLIC_TALLY_FEEDBACK_URL = originalEnv;
  }
});

describe("getTallyFeedbackFormId", () => {
  it("returns null when unset", () => {
    delete process.env.NEXT_PUBLIC_TALLY_FEEDBACK_URL;
    expect(getTallyFeedbackFormId()).toBeNull();
    expect(isTallyFeedbackConfigured()).toBe(false);
  });

  it("parses a Tally share URL", () => {
    process.env.NEXT_PUBLIC_TALLY_FEEDBACK_URL =
      "https://tally.so/r/wAbc123";
    expect(getTallyFeedbackFormId()).toBe("wAbc123");
    expect(isTallyFeedbackConfigured()).toBe(true);
  });

  it("accepts a raw form id", () => {
    process.env.NEXT_PUBLIC_TALLY_FEEDBACK_URL = "wAbc123";
    expect(getTallyFeedbackFormId()).toBe("wAbc123");
  });
});
