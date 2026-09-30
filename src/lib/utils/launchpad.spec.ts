import { describe, expect, it } from "vitest";
import { launchpadBugUrl, launchpadPath } from "./launchpad";

const OCI =
  "https://launchpad.net/~cloud-images-release-managers/cloud-images/+oci/ubuntu-base/+git/ubuntu-base";
const PERSONAL = "https://launchpad.net/~sd-packages/+git/rock_demo";

describe("launchpadBugUrl", () => {
  it("files against the project that owns the repository", () => {
    expect(launchpadBugUrl(OCI)).toBe(
      "https://bugs.launchpad.net/cloud-images/+filebug",
    );
  });

  it("reads a plain project url", () => {
    expect(launchpadBugUrl("https://launchpad.net/cloud-images")).toBe(
      "https://bugs.launchpad.net/cloud-images/+filebug",
    );
  });

  it("accepts the git host too", () => {
    expect(
      launchpadBugUrl("https://git.launchpad.net/~team/myproject/+git/thing"),
    ).toBe("https://bugs.launchpad.net/myproject/+filebug");
  });

  it("is null for a repository owned by a person", () => {
    expect(launchpadBugUrl(PERSONAL)).toBeNull();
  });

  it.each([
    ["github", "https://github.com/canonical/valkey-rock"],
    ["a lookalike host", "https://launchpad.net.attacker.example/a/b"],
    ["an unparseable value", "not a url"],
    ["an empty value", ""],
  ])("is null for %s", (_label, url) => {
    expect(launchpadBugUrl(url)).toBeNull();
  });
});

describe("launchpadPath", () => {
  it("reads the repository path a git host serves", () => {
    expect(launchpadPath(OCI)).toBe(
      "/~cloud-images-release-managers/cloud-images/+oci/ubuntu-base/+git/ubuntu-base",
    );
  });

  it("is null for a url that names no repository", () => {
    expect(launchpadPath("https://launchpad.net/cloud-images")).toBeNull();
  });

  it("is null for the bug host, which serves no git", () => {
    expect(
      launchpadPath("https://bugs.launchpad.net/~team/p/+git/r"),
    ).toBeNull();
  });
});
