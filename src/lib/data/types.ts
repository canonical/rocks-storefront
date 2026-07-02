/** Domain types for a rock detail page. */

export interface Publisher {
  name: string;
  verified: boolean;
}

export interface LinkItem {
  label: string;
  url: string;
  /** Icon key, resolved by the LinkList component (e.g. "github", "code", "bug"). */
  icon?: string;
}

export interface Rock {
  name: string;
  /** Slug used in the URL, e.g. "prometheus". */
  slug: string;
  iconUrl: string;
  publisher: Publisher;
  category: string;
  publishedAt: string; // ISO timestamp; formatted in the UI ("2 days ago")
  quickPull: {
    latestTag: string;
    learnMoreHref: string;
  };
  securityCompliance: string[];
  sourceCode: LinkItem[];
  architectures: string[];
  bases: string[];
  license: string;
  contacts: LinkItem[];
  discussionHref: string;
  /** Rendered description body as sanitized HTML. */
  descriptionHtml: string;
  /** Rendered documentation body as sanitized HTML. */
  documentationHtml: string;
  feedbackHref: string;
}
