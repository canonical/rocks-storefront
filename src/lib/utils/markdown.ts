import MarkdownIt from "markdown-it";

/**
 * Shared markdown renderer for publisher-authored content (rock descriptions).
 */
const md = new MarkdownIt({
  html: false,
  linkify: true,
});

export function renderMarkdown(source: string): string {
  return md.render(source);
}
