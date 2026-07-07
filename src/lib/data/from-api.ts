import type { ChannelMapItem, RockInfoResponse } from "$lib/server/api/types";
import type { ChannelRow, LinkItem, Rock } from "./types";

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
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return "file";
  }
  return hostname === "github.com" || hostname.endsWith(".github.com")
    ? "github"
    : "file";
}

function compact<T>(values: (T | null | undefined)[]): T[] {
  return values.filter((value): value is T => Boolean(value));
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

// The Ubuntu base is the last version in a track, e.g. "9.0-24.04" -> "24.04".
function baseFromTrack(track: string | undefined): string | undefined {
  const matches = track?.match(/\d+\.\d+/g);
  return matches?.[matches.length - 1];
}

function toChannelRow(item: ChannelMapItem): ChannelRow {
  const channel = item.channel;
  const downloadUrl = item.revision?.download?.url ?? "";
  return {
    version: item.revision?.version ?? channel?.track ?? "",
    architecture: (channel?.platform?.architecture ?? "").toUpperCase(),
    lastUpdated:
      channel?.["released-at"] ?? item.revision?.["created-at"] ?? "",
    registries: downloadUrl ? [downloadUrl.split("/")[0]] : [],
    collection: baseFromTrack(channel?.track) ?? "",
  };
}

export function rockFromApi(info: RockInfoResponse): Rock {
  const meta = info.metadata ?? {};
  const channels = info["channel-map"] ?? [];

  const architectures = unique(
    compact(channels.map((item) => item.channel?.platform?.architecture)).map(
      (arch) => arch.toUpperCase(),
    ),
  );

  const bases = unique(
    compact(channels.map((item) => baseFromTrack(item.channel?.track))),
  );

  const latestRelease = compact(
    channels.map((item) => item.channel?.["released-at"]),
  ).reduce((latest, date) => (date > latest ? date : latest), "");

  const links = Object.entries(meta.links ?? {}).flatMap(([key, urls]) =>
    (urls ?? []).map((url) => ({ key, url })),
  );
  const isContactLink = (key: string) => /contact|issue|bug|support/i.test(key);
  const titleCase = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);

  const sourceCode: LinkItem[] = links
    .filter((link) => !isContactLink(link.key))
    .map((link) => ({
      label: titleCase(link.key),
      url: link.url,
      icon: iconForUrl(link.url),
    }));

  const latestItem = channels.reduce<ChannelMapItem | undefined>(
    (latest, item) => {
      const date = item.channel?.["released-at"] ?? "";
      const latestDate = latest?.channel?.["released-at"] ?? "";
      return date > latestDate ? item : latest;
    },
    undefined,
  );
  const channelRows: ChannelRow[] = channels.map((item) => ({
    ...toChannelRow(item),
    channelTag: item === latestItem ? "latest" : (item.channel?.name ?? ""),
  }));
  const downloadRepo = (
    channels.find((item) => item.revision?.download?.url)?.revision?.download
      ?.url ?? ""
  ).split("@")[0];
  const pullCommand = downloadRepo
    ? `docker pull ${downloadRepo}:${info["default-track"] || "latest"}`
    : `docker pull ${info.name}:latest`;

  const contacts: LinkItem[] = [
    ...links
      .filter((link) => isContactLink(link.key))
      .map((link) => ({
        label: titleCase(link.key),
        url: link.url,
        icon: "bug",
      })),
    ...(meta.contact
      ? [
          {
            label: meta.contact,
            url: meta.contact.startsWith("http")
              ? meta.contact
              : `mailto:${meta.contact}`,
            icon: "bug",
          },
        ]
      : []),
  ];

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
    sourceCode,
    architectures,
    bases,
    license: meta.license && meta.license !== "unset" ? meta.license : "",
    contacts,
    discussionHref: meta.website || DISCOURSE_HREF,
    descriptionHtml: meta.description ? textToHtml(meta.description) : "",
    documentationHtml: "",
    feedbackHref: FEEDBACK_HREF,
    tagsChannels: {
      pullCommand,
      channels: channelRows,
    },
  };
}
