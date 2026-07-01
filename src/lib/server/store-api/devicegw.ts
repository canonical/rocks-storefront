/**
 * Device gateway client (`api.snapcraft.io` / `api.charmhub.io`).
 *
 * Ports `canonicalwebteam/store_api/devicegw.py`. Every method here maps to a
 * public, unauthenticated endpoint; the surface and URL/param/header
 * construction mirror the Python `DeviceGW` client one-to-one.
 */

import { env } from "$env/dynamic/private";
import { Base } from "./base";
import type { ApiConfig, ClientOptions, JsonObject } from "./types";

const DEVICEGW_URL = env.DEVICEGW_URL ?? "https://api.snapcraft.io/";

const SEARCH_FIELDS = [
  "package_name",
  "title",
  "summary",
  "architecture",
  "media",
  "developer_name",
  "developer_id",
  "developer_validation",
  "origin",
  "apps",
  "sections",
];

export interface DeviceGWOptions extends ClientOptions {
  /** Filter results to a specific store. */
  store?: string;
  /**
   * Override the base URL (defaults to `DEVICEGW_URL`). Unlike the Python
   * client there is no separate `staging` flag: point `baseUrl` at the staging
   * host (e.g. `https://api.staging.snapcraft.io/`) to target staging.
   */
  baseUrl?: string;
}

export interface SearchOptions {
  size?: number;
  page?: number;
  category?: string;
  arch?: string;
  apiVersion?: number;
}

export interface FindOptions {
  query?: string;
  category?: string;
  architecture?: string;
  publisher?: string;
  featured?: string;
  fields?: string[];
}

export interface PaginationOptions {
  size?: number;
  page?: number;
  apiVersion?: number;
}

export interface ItemDetailsOptions {
  channel?: string;
  fields?: string[];
  apiVersion?: number;
}

export interface SnapDetailsOptions {
  channel?: string;
  fields?: string[];
}

export interface CategoriesOptions {
  apiVersion?: number;
  type?: string;
}

export interface FeaturedSnapsOptions {
  apiVersion?: number;
  fields?: string;
  headers?: Record<string, string>;
}

export class DeviceGW extends Base {
  private config: ApiConfig;

  constructor(namespace: string, options: DeviceGWOptions = {}) {
    super(options.fetch ?? fetch, options.logger);

    const baseUrl = options.baseUrl ?? DEVICEGW_URL;

    this.config = {
      1: {
        baseUrl: `${baseUrl}api/v1/${namespace}s/`,
        headers: { "X-Ubuntu-Series": "16" },
      },
      2: {
        baseUrl: `${baseUrl}v2/${namespace}s/`,
        headers: { "Snap-Device-Series": "16" },
      },
    };

    if (options.store) {
      this.config[1].headers["X-Ubuntu-Store"] = options.store;
      this.config[2].headers["Snap-Device-Store"] = options.store;
    }
  }

  getEndpointUrl(endpoint: string, apiVersion = 1): string {
    return `${this.config[apiVersion].baseUrl}${endpoint}`;
  }

  private headers(apiVersion: number): Record<string, string> {
    return { ...this.config[apiVersion].headers };
  }

  /**
   * Documentation: https://api.snapcraft.io/docs/search.html#snap_search
   */
  async search(
    query: string,
    options: SearchOptions = {},
  ): Promise<JsonObject> {
    const {
      size = 100,
      page = 1,
      category,
      arch = "wide",
      apiVersion = 1,
    } = options;

    const url = this.getEndpointUrl("search", apiVersion);
    const headers = this.headers(apiVersion);

    let search = query;
    if (!search.includes("publisher:")) {
      search = search.replaceAll(":", " ");
    }

    // "wide" is passed via both the header and the query param: the header is
    // used when present, and `arch` is ignored unless it equals "wide".
    headers["X-Ubuntu-Architecture"] = arch;

    const params: Record<string, string | number> = {
      q: search,
      size,
      page,
      scope: "wide",
      confinement: "strict,classic",
      fields: SEARCH_FIELDS.join(","),
      arch,
    };

    if (category) {
      params.section = category;
    }

    return (await this.get(url, params, headers)) as JsonObject;
  }

  /**
   * Documentation: https://api.snapcraft.io/docs/search.html#snaps_find
   */
  async find(options: FindOptions = {}): Promise<JsonObject> {
    const {
      query = "",
      category = "",
      architecture = "",
      publisher = "",
      featured = "",
      fields = [],
    } = options;

    const url = this.getEndpointUrl("find", 2);
    const params: Record<string, string> = { q: query };
    if (fields.length) {
      params.fields = fields.join(",");
    }
    if (architecture) {
      params.architecture = architecture;
    }
    if (category) {
      params.category = category;
    }
    if (publisher) {
      params.publisher = publisher;
    }
    if (featured) {
      params.featured = featured;
    }

    return (await this.get(url, params, this.headers(2))) as JsonObject;
  }

  /**
   * Documentation: https://api.snapcraft.io/docs/search.html#snap_search
   */
  async getAllItems(size: number, apiVersion = 1): Promise<JsonObject> {
    const url = this.getEndpointUrl("search", apiVersion);
    return (await this.get(
      url,
      { scope: "wide", size },
      this.headers(apiVersion),
    )) as JsonObject;
  }

  /**
   * Documentation: https://api.snapcraft.io/docs/search.html#snap_search
   */
  getCategoryItems(
    category: string,
    options: PaginationOptions = {},
  ): Promise<JsonObject> {
    const { size = 10, page = 1, apiVersion = 1 } = options;
    return this.search("", { category, size, page, apiVersion });
  }

  /**
   * Documentation: https://api.snapcraft.io/docs/search.html#snap_search
   */
  getFeaturedItems(options: PaginationOptions = {}): Promise<JsonObject> {
    const { size = 10, page = 1, apiVersion = 1 } = options;
    return this.search("", { category: "featured", size, page, apiVersion });
  }

  /**
   * Documentation: https://api.snapcraft.io/docs/search.html#snap_search
   */
  getPublisherItems(
    publisher: string,
    options: PaginationOptions = {},
  ): Promise<JsonObject> {
    const { size = 500, page = 1, apiVersion = 1 } = options;
    return this.search(`publisher:${publisher}`, { size, page, apiVersion });
  }

  /**
   * Documentation: https://api.snapcraft.io/docs/info.html
   */
  async getItemDetails(
    name: string,
    options: ItemDetailsOptions = {},
  ): Promise<JsonObject> {
    const { channel, fields = [], apiVersion = 2 } = options;
    const url = this.getEndpointUrl(`info/${name}`, apiVersion);
    const params: Record<string, string> = {};
    if (fields.length) {
      params.fields = fields.join(",");
    }
    if (channel) {
      params.channel = channel;
    }
    return (await this.get(
      url,
      params,
      this.headers(apiVersion),
    )) as JsonObject;
  }

  /**
   * Documentation: https://api.snapcraft.io/docs/details.html#snap_details
   */
  async getSnapDetails(
    name: string,
    options: SnapDetailsOptions = {},
  ): Promise<JsonObject> {
    // This endpoint is only available in API version 1.
    const apiVersion = 1;
    const { channel, fields = [] } = options;
    const url = this.getEndpointUrl(`details/${name}`, apiVersion);
    const params: Record<string, string> = {};
    if (fields.length) {
      params.fields = fields.join(",");
    }
    // An empty channel string tells the endpoint not to filter by channel;
    // omitting it defaults to latest/stable.
    if (channel !== undefined) {
      params.channel = channel;
    }
    return (await this.get(
      url,
      params,
      this.headers(apiVersion),
    )) as JsonObject;
  }

  /**
   * Documentation: https://api.snapcraft.io/docs/metrics.html
   */
  async getPublicMetrics(json: unknown, apiVersion = 1): Promise<JsonObject> {
    const url = this.getEndpointUrl("metrics");
    const headers = this.headers(apiVersion);
    headers["Content-Type"] = "application/json";
    return (await this.request(url, {
      method: "POST",
      headers,
      json,
    })) as JsonObject;
  }

  /**
   * Documentation: https://api.snapcraft.io/docs/categories.html
   */
  async getCategories(options: CategoriesOptions = {}): Promise<JsonObject> {
    const { apiVersion = 2, type = "shared" } = options;
    const url = this.getEndpointUrl("categories", apiVersion);
    return (await this.get(
      url,
      { type },
      this.headers(apiVersion),
    )) as JsonObject;
  }

  /**
   * Documentation:
   *   https://api.snapcraft.io/docs/charms.html#list_resource_revisions
   */
  async getResourceRevisions(
    name: string,
    resourceName: string,
    apiVersion = 2,
  ): Promise<unknown[]> {
    const url = this.getEndpointUrl(
      `resources/${name}/${resourceName}/revisions`,
      apiVersion,
    );
    const body = (await this.get(
      url,
      undefined,
      this.headers(apiVersion),
    )) as JsonObject;
    return body.revisions as unknown[];
  }

  /**
   * Documentation:
   *   https://docs.google.com/document/d/1UAybxuZyErh3ayqb4nzL3T4BbvMtnmKKEPu-ixcCj_8/edit
   */
  async getFeaturedSnaps(
    options: FeaturedSnapsOptions = {},
  ): Promise<JsonObject> {
    const { apiVersion = 1, fields = "snap_id", headers = {} } = options;
    const url = this.getEndpointUrl("search");
    const mergedHeaders = { ...this.headers(apiVersion), ...headers };
    const params = {
      scope: "wide",
      arch: "wide",
      confinement: "strict,classic,devmode",
      fields,
      section: "featured",
    };
    return (await this.get(url, params, mergedHeaders)) as JsonObject;
  }

  private async get(
    url: string,
    params: Record<string, string | number> | undefined,
    headers: Record<string, string>,
  ): Promise<unknown> {
    return this.request(url, { params, headers });
  }
}
