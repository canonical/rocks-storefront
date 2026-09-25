import { describe, expect, it } from "vitest";
import { renderMarkdown, renderReadmeMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("renders ordinary markdown", () => {
    const html = renderMarkdown("# Title\n\nSome **bold** text.");

    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("escapes raw HTML instead of emitting it", () => {
    const html = renderMarkdown("<script>alert('xss')</script>");

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes inline HTML attributes that could carry handlers", () => {
    const html = renderMarkdown('<img src="x" onerror="alert(1)">');

    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("escapes HTML inside fenced code blocks", () => {
    const html = renderMarkdown("```\n<script>alert(1)</script>\n```");

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("does not build an anchor for a javascript: link", () => {
    const html = renderMarkdown("[click me](javascript:alert(1))");

    expect(html).not.toContain("<a ");
    expect(html).toContain("click me");
  });

  it("does not build an anchor for a vbscript: link", () => {
    const html = renderMarkdown("[click me](vbscript:msgbox(1))");

    expect(html).not.toContain("<a ");
  });

  it("does not build an anchor for a non-image data: link", () => {
    const html = renderMarkdown(
      "[click me](data:text/html,<script>1</script>)",
    );

    expect(html).not.toContain("<a ");
    expect(html).toContain("&lt;script&gt;");
  });

  it("allows image data: URIs", () => {
    const html = renderMarkdown(
      "![dot](data:image/gif;base64,R0lGODlhAQABAAAAACw=)",
    );

    expect(html).toContain("data:image/gif;base64");
  });

  it("keeps ordinary http and https links", () => {
    const html = renderMarkdown("[canonical](https://canonical.com)");

    expect(html).toContain('href="https://canonical.com"');
  });

  it("linkifies bare URLs", () => {
    const html = renderMarkdown("See https://canonical.com for details.");

    expect(html).toContain('<a href="https://canonical.com"');
  });

  it("returns an empty string for empty input", () => {
    expect(renderMarkdown("")).toBe("");
  });
});

describe("renderReadmeMarkdown", () => {
  const REPO = "https://github.com/canonical/valkey-rock";

  it("drops images, which are CI badges we cannot load under our CSP", () => {
    const html = renderReadmeMarkdown(
      "[![Release](https://github.com/o/r/badge.svg)](https://github.com/o/r/actions)",
      REPO,
    );

    expect(html).not.toContain("<img");
    expect(html).toContain('href="https://github.com/o/r/actions"');
  });

  it("drops a bare image too", () => {
    const html = renderReadmeMarkdown("![logo](docs/logo.png)", REPO);

    expect(html).not.toContain("<img");
  });

  it("resolves a relative link against the repository", () => {
    const html = renderReadmeMarkdown("[Contributing](CONTRIBUTING.md)", REPO);

    expect(html).toContain(
      'href="https://github.com/canonical/valkey-rock/blob/HEAD/CONTRIBUTING.md"',
    );
  });

  it("resolves a root-relative link against the repository", () => {
    const html = renderReadmeMarkdown("[Docs](/docs/usage.md)", REPO);

    expect(html).toContain(
      'href="https://github.com/canonical/valkey-rock/blob/HEAD/docs/usage.md"',
    );
  });

  it("leaves absolute links untouched", () => {
    const html = renderReadmeMarkdown("[Rockcraft](https://ubuntu.com/)", REPO);

    expect(html).toContain('href="https://ubuntu.com/"');
  });

  it("leaves in-page anchors untouched", () => {
    const html = renderReadmeMarkdown("[Usage](#usage)", REPO);

    expect(html).toContain('href="#usage"');
  });

  it("still escapes raw HTML", () => {
    const html = renderReadmeMarkdown("<script>alert('xss')</script>", REPO);

    expect(html).not.toContain("<script>");
  });

  it("keeps the leading title", () => {
    const html = renderReadmeMarkdown("# Valkey rock\n\nA **rock**.", REPO);

    expect(html).toContain("<h2>Valkey rock</h2>");
  });

  it("demotes headings so the page keeps a single h1", () => {
    const html = renderReadmeMarkdown("Intro.\n\n# Section", REPO);

    expect(html).not.toContain("<h1>");
    expect(html).toContain("<h2>Section</h2>");
  });

  it("demotes every heading level", () => {
    const html = renderReadmeMarkdown("## Usage\n\n### Detail", REPO);

    expect(html).toContain("<h3>Usage</h3>");
    expect(html).toContain("<h4>Detail</h4>");
  });

  it("does not demote past the deepest heading level", () => {
    const html = renderReadmeMarkdown("###### Deep", REPO);

    expect(html).toContain("<h6>Deep</h6>");
  });
});
