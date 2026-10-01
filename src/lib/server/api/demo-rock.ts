import { FALLBACK_ICON } from "$lib/utils/rock";
import type {
  ChannelMapItem,
  RockFindResultItem,
  RockInfoResponse,
} from "./types";

/**
 * A made-up rock with every field the API can return filled in.
 */
export const DEMO_ROCK_NAME = "demo-rock";

const REGISTRY = `rocks.pkg.store/ubuntu/${DEMO_ROCK_NAME}`;
const PACKAGE_ID = "0000000000000000000000000000demo";

const DESCRIPTION = `Demo Rock is a stand-in package used to exercise this storefront against data that no published rock currently provides.

## Why it exists

Every real rock in the store fills in a handful of fields and leaves the rest empty. That makes several parts of this page impossible to see: the contact list, the categories, more than one risk, and a title that reads differently from the package name.

## Running it

Pull the image for the track you want, then run it:

\`\`\`bash
docker run --rm -it ${REGISTRY}:2.1-26.04_stable
\`\`\`

The container listens on port 8080 and writes its logs to stdout.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| \`DEMO_PORT\` | \`8080\` | Port the service binds to |
| \`DEMO_LOG_LEVEL\` | \`info\` | One of debug, info, warn, error |

See the [upstream documentation](https://example.com/demo-rock/docs) for the full set of options.`;

const CARD_METADATA = {
  title: "Demo Rock",
  summary: "A complete rock, invented for exercising this storefront",
  publisher: {
    "display-name": "Demo Publisher",
    id: PACKAGE_ID,
    username: "demo-publisher",
    validation: "verified",
  },
  categories: [
    { name: "featured", featured: true },
    { name: "databases", featured: false },
  ],
  media: [{ type: "icon", url: FALLBACK_ICON, width: 256, height: 256 }],
};

const METADATA = {
  ...CARD_METADATA,
  description: DESCRIPTION,
  license: "Apache-2.0",
  contact: "demo-team@example.com",
  website: "https://example.com/demo-rock",
  private: false,
  links: {
    upstream: ["https://github.com/example/demo-rock"],
    issues: ["https://example.com/demo-rock/issues"],
    // Every shape a contact can take, so each rendering path is visible.
    contact: [
      "https://example.com/demo-rock/support",
      "mailto:maintainers@example.com",
      "tel:+441234567890",
      "https://github.com/example",
      "demo-publisher",
      "@demo-team:matrix.example.com",
    ],
    website: ["https://example.com/demo-rock"],
  },
};

const TRACKS = [
  {
    track: "2.1-26.04",
    version: "2.1.4",
    risks: ["stable", "candidate", "beta", "edge"],
    architectures: ["amd64", "arm64", "ppc64el", "s390x"],
    releasedAt: "2026-09-22T11:04:19Z",
  },
  {
    track: "2.0-26.04",
    version: "2.0.9",
    risks: ["stable", "edge"],
    architectures: ["amd64", "arm64", "riscv64"],
    releasedAt: "2026-06-11T08:41:02Z",
  },
  {
    track: "1.9-24.04",
    version: "1.9.12",
    risks: ["stable"],
    architectures: ["amd64"],
    releasedAt: "2025-11-03T15:22:47Z",
  },
];

const NEWEST_REVISION = 239;

const RISK_AGE_DAYS: Record<string, number> = {
  stable: 0,
  candidate: 4,
  beta: 9,
  edge: 15,
};

/** A stable, plausible-looking hex string, so digests are not all alike. */
function digest(revision: number): string {
  return revision.toString(16).padStart(4, "0").repeat(16);
}

function daysBefore(iso: string, days: number): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() - days);

  return date.toISOString().replace(/\.\d+Z$/, "Z");
}

function channelMap(): ChannelMapItem[] {
  const items: ChannelMapItem[] = [];
  let revision = NEWEST_REVISION + 1;

  for (const entry of TRACKS) {
    for (const risk of entry.risks) {
      const releasedAt = daysBefore(entry.releasedAt, RISK_AGE_DAYS[risk]);

      for (const architecture of entry.architectures) {
        revision -= 1;
        const sha = digest(revision);

        items.push({
          channel: {
            name: `${entry.track}/${risk}`,
            track: entry.track,
            risk,
            platform: { architecture },
            "released-at": releasedAt,
          },
          revision: {
            revision,
            version: entry.version,
            "created-at": daysBefore(releasedAt, 1),
            platforms: [{ architecture }],
            download: {
              "sha-256": sha,
              size: 24_000_000 + revision * 40_000,
              url: `${REGISTRY}@sha256:${sha}`,
            },
          },
        });
      }
    }
  }

  return items;
}

export const demoRockDetails: RockInfoResponse = {
  name: DEMO_ROCK_NAME,
  "package-id": PACKAGE_ID,
  "default-track": TRACKS[0].track,
  metadata: METADATA,
  "channel-map": channelMap(),
};

export const demoRockFindItem: RockFindResultItem = {
  name: DEMO_ROCK_NAME,
  "package-id": PACKAGE_ID,
  metadata: CARD_METADATA,
  "default-release": {
    channel: {
      name: `${TRACKS[0].track}/stable`,
      track: TRACKS[0].track,
      risk: "stable",
      platform: { architecture: TRACKS[0].architectures[0] },
      "released-at": TRACKS[0].releasedAt,
    },
    revision: NEWEST_REVISION,
    version: TRACKS[0].version,
  },
};

export function demoRockMatches(query: string): boolean {
  const term = query.trim().toLowerCase();
  if (term === "%") return true;

  return `${DEMO_ROCK_NAME} ${CARD_METADATA.title}`
    .toLowerCase()
    .includes(term);
}
