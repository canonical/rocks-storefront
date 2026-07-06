import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./date";

const NOW = new Date("2026-07-02T00:00:00.000Z");

describe("formatRelativeTime", () => {
  it("formats a difference of days", () => {
    expect(formatRelativeTime("2026-06-30T00:00:00.000Z", NOW)).toBe(
      "2 days ago",
    );
  });

  it("uses the auto phrasing for a single day", () => {
    expect(formatRelativeTime("2026-07-01T00:00:00.000Z", NOW)).toBe(
      "yesterday",
    );
  });

  it("formats a difference of hours", () => {
    expect(formatRelativeTime("2026-07-01T21:00:00.000Z", NOW)).toBe(
      "3 hours ago",
    );
  });

  it("formats a difference of months", () => {
    expect(formatRelativeTime("2026-05-01T00:00:00.000Z", NOW)).toBe(
      "2 months ago",
    );
  });

  it("formats a difference of years", () => {
    expect(formatRelativeTime("2024-07-02T00:00:00.000Z", NOW)).toBe(
      "2 years ago",
    );
  });

  it("falls back to 'just now' for sub-minute differences", () => {
    expect(formatRelativeTime("2026-07-01T23:59:30.000Z", NOW)).toBe(
      "just now",
    );
  });
});
