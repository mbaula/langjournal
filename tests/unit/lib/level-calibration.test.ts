import { CefrLevel } from "@prisma/client";

import { describe, expect, it } from "vitest";

import {
  getPromptCefrBandsForDeclaredLevel,
  mapDeclaredLevelToCefr,
} from "@/lib/level-calibration";

describe("level-calibration", () => {
  describe("mapDeclaredLevelToCefr", () => {
    it("maps beginner, intermediate, proficient", () => {
      expect(mapDeclaredLevelToCefr("beginner")).toBe(CefrLevel.A1);
      expect(mapDeclaredLevelToCefr("intermediate")).toBe(CefrLevel.B1);
      expect(mapDeclaredLevelToCefr("proficient")).toBe(CefrLevel.B2);
    });
  });

  describe("getPromptCefrBandsForDeclaredLevel", () => {
    it("returns prompt bands per declared tier", () => {
      expect(getPromptCefrBandsForDeclaredLevel("beginner")).toEqual([
        CefrLevel.A1,
        CefrLevel.A2,
      ]);
      expect(getPromptCefrBandsForDeclaredLevel("intermediate")).toEqual([
        CefrLevel.B1,
        CefrLevel.B2,
      ]);
      expect(getPromptCefrBandsForDeclaredLevel("proficient")).toEqual([
        CefrLevel.B2,
        CefrLevel.C1,
      ]);
    });
  });
});
