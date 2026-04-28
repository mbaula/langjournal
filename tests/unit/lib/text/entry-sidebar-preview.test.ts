import { describe, expect, it } from "vitest";

import { bodySnippetForSidebar } from "@/lib/text/entry-sidebar-preview";

describe("bodySnippetForSidebar", () => {
  it("returns 'Empty entry' for null", () => {
    expect(bodySnippetForSidebar(null)).toBe("Empty entry");
  });

  it("returns 'Empty entry' for undefined", () => {
    expect(bodySnippetForSidebar(undefined)).toBe("Empty entry");
  });

  it("returns 'Empty entry' for empty string", () => {
    expect(bodySnippetForSidebar("")).toBe("Empty entry");
  });

  it("returns 'Empty entry' for whitespace-only string", () => {
    expect(bodySnippetForSidebar("   \n\n   ")).toBe("Empty entry");
  });

  it("returns the first line when short enough", () => {
    expect(bodySnippetForSidebar("Hello world")).toBe("Hello world");
  });

  it("collapses multiple spaces into one", () => {
    expect(bodySnippetForSidebar("Hello    world")).toBe("Hello world");
  });

  it("extracts first line from multiline text", () => {
    expect(bodySnippetForSidebar("First line\nSecond line")).toBe("First line");
  });

  it("skips empty lines to find first non-empty line", () => {
    expect(bodySnippetForSidebar("\n\nActual content\nMore")).toBe(
      "Actual content",
    );
  });

  it("extracts first paragraph (stops at double newline)", () => {
    expect(bodySnippetForSidebar("First para\n\nSecond para")).toBe(
      "First para",
    );
  });

  it("extracts sentence ending with period", () => {
    const input = "This is a sentence. This is another sentence.";
    expect(bodySnippetForSidebar(input)).toBe("This is a sentence.");
  });

  it("extracts sentence ending with exclamation", () => {
    const input = "Hello world! More text here.";
    expect(bodySnippetForSidebar(input)).toBe("Hello world!");
  });

  it("extracts sentence ending with question mark", () => {
    const input = "How are you? I am fine.";
    expect(bodySnippetForSidebar(input)).toBe("How are you?");
  });

  it("truncates long text with ellipsis when over maxLen", () => {
    const longText = "A".repeat(100);
    const result = bodySnippetForSidebar(longText);
    expect(result.length).toBe(88);
    expect(result.endsWith("…")).toBe(true);
  });

  it("respects custom maxLen parameter", () => {
    const text = "This is a moderately long sentence without punctuation";
    const result = bodySnippetForSidebar(text, 20);
    expect(result.length).toBe(20);
    expect(result.endsWith("…")).toBe(true);
  });

  it("does not truncate when exactly at maxLen", () => {
    const text = "A".repeat(88);
    expect(bodySnippetForSidebar(text)).toBe(text);
  });

  it("normalizes CRLF to LF", () => {
    expect(bodySnippetForSidebar("Line one\r\nLine two")).toBe("Line one");
  });

  it("handles sentence within 140 char limit", () => {
    const sentence = "Short sentence.";
    const rest = " " + "X".repeat(100);
    expect(bodySnippetForSidebar(sentence + rest)).toBe("Short sentence.");
  });

  it("does not match period inside word", () => {
    const input = "Visit example.com for more info today";
    const result = bodySnippetForSidebar(input);
    expect(result).toBe(input);
  });
});
