import { describe, expect, it } from "vitest";
import { githubRepo, githubRepoUrl } from "./github";

describe("githubRepoUrl", () => {
  it.each([
    [
      "https://github.com/canonical/valkey-rock.git",
      "https://github.com/canonical/valkey-rock",
    ],
    [
      "https://github.com/canonical/go-rock/",
      "https://github.com/canonical/go-rock",
    ],
    [
      "https://github.com/canonical/curl-rock",
      "https://github.com/canonical/curl-rock",
    ],
  ])("normalises %s", (url, expected) => {
    expect(githubRepoUrl(url)).toBe(expected);
  });
});

describe("githubRepo", () => {
  it.each([
    [
      "https://github.com/canonical/postgresql-rock",
      "canonical/postgresql-rock",
    ],
    ["https://github.com/canonical/valkey-rock.git", "canonical/valkey-rock"],
    ["https://github.com/canonical/go-rock/", "canonical/go-rock"],
  ])("reads owner/repo out of %s", (url, expected) => {
    expect(githubRepo(url)).toBe(expected);
  });

  it.each([
    ["launchpad", "https://launchpad.net/~sd-packages/+git/rock_x"],
    ["a host that merely ends in github.com", "https://evil-github.com/a/b"],
    [
      "a subdomain of an attacker domain",
      "https://github.com.attacker.net/a/b",
    ],
    ["a url with no repo", "https://github.com/canonical"],
    ["a url with extra path segments", "https://github.com/canonical/x/issues"],
    ["a non-https scheme", "http://github.com/canonical/curl-rock"],
    ["an unparseable value", "not a url"],
    ["an empty value", ""],
  ])("returns null for %s", (_label, url) => {
    expect(githubRepo(url)).toBeNull();
  });
});
