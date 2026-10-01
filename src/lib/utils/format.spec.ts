import { describe, expect, it } from "vitest";
import { formatCategory, formatFileSize, truncateDigest } from "./format";

describe("formatCategory", () => {
  it.each([
    ["databases", "Databases"],
    ["os-bases", "Os-Bases"],
    ["toolchains/languages", "Toolchains/Languages"],
    ["machine learning", "Machine Learning"],
  ])("capitalises %s", (name, expected) => {
    expect(formatCategory(name)).toBe(expected);
  });

  it("leaves a name that is already capitalised alone", () => {
    expect(formatCategory("Web")).toBe("Web");
  });

  it("handles an empty name", () => {
    expect(formatCategory("")).toBe("");
  });
});

describe("formatFileSize", () => {
  it.each([
    [512, "512 B"],
    [32_432_071, "32.43 MB"],
  ])("formats %i bytes", (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });
});

describe("truncateDigest", () => {
  it("shortens a long digest", () => {
    expect(truncateDigest("abcdef0123456789")).toBe("abcdef012345…");
  });

  it("leaves a short digest alone", () => {
    expect(truncateDigest("abc")).toBe("abc");
  });
});
