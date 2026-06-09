import { afterEach, describe, expect, it } from "vitest";

import {
  getDevPreviewJournalEntries,
  getDevPreviewUser,
  isDevAccountPreviewCookie,
} from "@/lib/dev/preview-account";

describe("isDevAccountPreviewCookie", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("is true only in development with cookie value 1", () => {
    process.env.NODE_ENV = "development";
    expect(isDevAccountPreviewCookie("1")).toBe(true);
    expect(isDevAccountPreviewCookie("0")).toBe(false);
  });

  it("is false in production", () => {
    process.env.NODE_ENV = "production";
    expect(isDevAccountPreviewCookie("1")).toBe(false);
  });
});

describe("dev preview account fixtures", () => {
  it("returns stable mock user and entries", () => {
    expect(getDevPreviewUser().email).toBe("alex.preview@folio.local");
    expect(getDevPreviewJournalEntries().length).toBeGreaterThan(0);
  });
});
