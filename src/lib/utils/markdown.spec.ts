import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

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
