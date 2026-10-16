import { describe, expect, it } from "vitest";
import { formatCategory, formatFileSize } from "./format";

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
