import MarkdownIt from "markdown-it";
import { githubRepoUrl } from "./github";

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

/**
 * Renderer for READMEs fetched from a rock's upstream repository.
 * Three things are done before it can stand in as a rock description:
 *
 * - Images are dropped. Dropping them avoids widening the policy
 *   for hosts we do not control.
 * - Relative links are resolved against the repository
 * - Headings are demoted one level so the rock title stays the page's
 *   only h1.
 */
const readmeMd = new MarkdownIt({
  html: false,
  linkify: true,
});

readmeMd.renderer.rules.image = () => "";

for (const rule of ["heading_open", "heading_close"] as const) {
  readmeMd.renderer.rules[rule] = (tokens, idx, options, _env, self) => {
    const token = tokens[idx];
    const level = Number(token.tag.slice(1));
    token.tag = `h${Math.min(level + 1, 6)}`;

    return self.renderToken(tokens, idx, options);
  };
}

readmeMd.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const href = token.attrGet("href");
  const base = (env as { readmeBase?: string })?.readmeBase;
  const isRelative =
    href && !/^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith("#");

  if (base && isRelative) {
    token.attrSet("href", new URL(href.replace(/^\//, ""), base).toString());
  }

  return self.renderToken(tokens, idx, options);
};

export function renderReadmeMarkdown(source: string, repoUrl: string): string {
  const repo = githubRepoUrl(repoUrl);

  return readmeMd.render(source, { readmeBase: `${repo}/blob/HEAD/` });
}
