import MarkdownIt from "markdown-it";

/**
 * Shared markdown renderer for publisher-authored content (rock descriptions).
 *
 * `html: false` makes markdown-it escape any raw HTML in the source, and its
 * default link validation rejects unsafe protocols (`javascript:`, `vbscript:`,
 * non-image `data:`), so the rendered output is safe to inject with `{@html}`
 * without a separate DOM sanitiser — which also keeps it working under SSR.
 */
const md = new MarkdownIt({
  html: false,
  linkify: true,
});

export function renderMarkdown(source: string): string {
  return md.render(source);
}
