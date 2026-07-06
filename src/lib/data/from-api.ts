import type { RockInfoResponse } from "$lib/server/api/types";
import type { LinkItem, Rock } from "./types";

const LEARN_MORE_HREF = "https://documentation.ubuntu.com/rockcraft/";
const FEEDBACK_HREF = "https://ubuntu.com/survey";
const DISCOURSE_HREF = "https://discourse.ubuntu.com/";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Convert the API's plain-text description into simple, safe paragraphs. */
function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
}

function iconForUrl(url: string): string {
  return url.includes("github.com") ? "github" : "file";
}

/** Drop null/undefined/empty entries, narrowing the array to non-empty values. */
function compact<T>(values: (T | null | undefined)[]): T[] {
  return values.filter((value): value is T => Boolean(value));
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

/**
 * Map the store API's rock `info` response to the view model the detail-page
 * components consume. Fields the API doesn't provide (security/compliance,
 * separate documentation) fall back to empty.
 */
export function rockFromApi(info: RockInfoResponse): Rock {
  const meta = info.metadata ?? {};
  const channels = info["channel-map"] ?? [];

  const architectures = unique(
    compact(channels.map((item) => item.channel?.platform?.architecture)).map(
      (arch) => arch.toUpperCase(),
    ),
  );

  const bases = unique(
    compact(
      channels.map((item) => item.channel?.track?.match(/\d+\.\d+/)?.[0]),
    ),
  );

  const latestRelease = compact(
    channels.map((item) => item.channel?.["released-at"]),
  ).reduce((latest, date) => (date > latest ? date : latest), "");

  const sourceCode: LinkItem[] = Object.entries(meta.links ?? {}).flatMap(
    ([label, urls]) =>
      (urls ?? []).map((url) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        url,
        icon: iconForUrl(url),
      })),
  );

  const contacts: LinkItem[] = meta.contact
    ? [
        {
          label: meta.contact,
          url: meta.contact.startsWith("http")
            ? meta.contact
            : `mailto:${meta.contact}`,
          icon: "bug",
        },
      ]
    : [];

  return {
    name: meta.title || info.name,
    slug: info.name,
    iconUrl: meta.media?.find((item) => item.type === "icon")?.url ?? "",
    publisher: {
      name: meta.publisher?.["display-name"] || meta.publisher?.username || "",
      verified: meta.publisher?.validation === "verified",
    },
    category: meta.categories?.[0]?.name ?? "",
    publishedAt: latestRelease,
    quickPull: {
      latestTag: info["default-track"] || "latest",
      learnMoreHref: LEARN_MORE_HREF,
    },
    securityCompliance: [],
    sourceCode,
    architectures,
    bases,
    license: meta.license && meta.license !== "unset" ? meta.license : "",
    contacts,
    discussionHref: meta.website || DISCOURSE_HREF,
    descriptionHtml: meta.description ? textToHtml(meta.description) : "",
    documentationHtml: "",
    feedbackHref: FEEDBACK_HREF,
  };
}
