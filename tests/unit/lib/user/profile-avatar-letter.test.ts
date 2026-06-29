import { describe, expect, it } from "vitest";

import { profileAvatarLetter } from "@/lib/user/profile-avatar-letter";

describe("profileAvatarLetter", () => {
  it("returns null for empty or generic labels", () => {
    expect(profileAvatarLetter("")).toBeNull();
    expect(profileAvatarLetter("   ")).toBeNull();
    expect(profileAvatarLetter("Account")).toBeNull();
  });

  it("uses the first letter of the first word only", () => {
    expect(profileAvatarLetter("Linh ✨")).toBe("L");
    expect(profileAvatarLetter("Alex Chen")).toBe("A");
    expect(profileAvatarLetter("marie")).toBe("M");
  });

  it("uses the email local part when given an address", () => {
    expect(profileAvatarLetter("alex@example.com")).toBe("A");
  });
});
