/**
 * Helpers
 * */

type Optionalize<T> = {
  [K in keyof T]?: T[K];
};

/**
 * TS types for /find
 *
 * Converted from: https://api.snapcraft.io/docs/rocks/#id4
 * */

export interface RockFindResponse {
  results: RockFindResultItem[];
}

export interface RockFindResultItem {
  name: string;
  "package-id": string;
  "default-release"?: DefaultRelease;
  metadata?: Metadata;
}

export interface DefaultRelease {
  channel: Channel; // TODO: Channel, but nothing is optional
  revision: number;
  version: string;
}

export interface Channel {
  /** This channel's full name, as track/risk. eg "latest/stable". */
  name: string;
  /** This channel's supported base. */
  platform: Platform;
  /** The timestamp of the last release to this channel */
  "released-at": string | null;
  /** This channel's risk, eg "stable", "candidate", "beta", "edge". */
  risk: string;
  /** This channel's track. eg. "latest". */
  track: string;
}

export interface Category {
  featured: boolean;
  name: string;
}

export interface Media {
  height: number | null;
  type: string;
  url: string;
  width: number | null;
}

export interface Publisher {
  "display-name"?: string;
  id?: string;
  username?: string;
  validation?: string;
}

/**
 * TS types for /info
 *
 * Converted from: https://api.snapcraft.io/docs/rocks/#response-json-schema
 * */

export interface RockInfoResponse {
  /** Root required properties */
  name: string;
  "package-id": string;

  /** Optional root properties */
  "channel-map"?: ChannelMapItem[];
  "default-track"?: string | null;
  metadata?: Metadata;
}

export interface ChannelMapItem {
  channel?: Optionalize<Channel>;
  revision?: Revision;
}

export interface Revision {
  /** The timestamp of this revision's creation. */
  "created-at"?: string;
  download?: {
    "sha-256": string;
    size?: number;
    url: string;
  };
  /** The revision's supported platforms. */
  platforms?: Platform[];
  /** The integer revision number. */
  revision?: number;
  /** This revision's version string. */
  version?: string;
}

export interface Platform {
  architecture: string;
}

export interface Metadata {
  categories?: Category[];
  contact?: string;
  description?: string;
  license?: string;
  /** * Represented as an object with additional properties containing arrays of strings.
   * e.g., { "github": ["https://github.com/..."], "docs": ["..."] }
   */
  links?: Record<string, string[]>;
  media?: Media[];
  private?: boolean;
  publisher?: Publisher;
  summary?: string;
  title?: string;
  website?: string | null;
}
