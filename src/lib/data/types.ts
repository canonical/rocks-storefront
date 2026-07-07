export interface Publisher {
  name: string;
  verified: boolean;
}

export interface LinkItem {
  label: string;
  url: string;
  icon?: string;
}

export interface Rock {
  name: string;
  slug: string;
  iconUrl: string;
  publisher: Publisher;
  category: string;
  publishedAt: string;
  quickPull: {
    latestTag: string;
    learnMoreHref: string;
  };
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
