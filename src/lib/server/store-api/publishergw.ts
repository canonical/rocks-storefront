/**
 * Publisher gateway client (`api.charmhub.io`).
 *
 * Ports the **public, unauthenticated** subset of
 * `canonicalwebteam/store_api/publishergw.py`. All macaroon/token-authenticated
 * methods (and the entire Dashboard client) are intentionally omitted from this
 * first pass; see the package README for the migration status.
 */

import { env } from "$env/dynamic/private";
import { Base } from "./base";
import { HttpSession } from "./http";
import type { ClientOptions, JsonObject } from "./types";

const PUBLISHERGW_URL = env.PUBLISHERGW_URL ?? "https://api.charmhub.io";

interface PublisherApiConfig {
  baseUrl: string;
}

export interface PublisherGWOptions extends ClientOptions {
  /** Override the base URL (primarily for tests). */
  baseUrl?: string;
}

export interface PublisherFindOptions {
  query?: string;
  category?: string;
  publisher?: string;
  type?: string;
  provides?: string[];
  requires?: string[];
  fields?: string[];
}

export interface PublisherCategoriesOptions {
  apiVersion?: number;
  type?: string;
}

export interface PublisherItemDetailsOptions {
  channel?: string;
  fields?: string[];
  apiVersion?: number;
}

export class PublisherGW extends Base {
  private nameSpace: string;
  private config: Record<number, PublisherApiConfig>;

  constructor(nameSpace: string, options: PublisherGWOptions = {}) {
    const session = options.session ?? new HttpSession(options.fetch ?? fetch);
    super(session, options.logger);

    this.nameSpace = nameSpace;
    const baseUrl = options.baseUrl ?? PUBLISHERGW_URL;
    this.config = {
      1: { baseUrl: `${baseUrl}/v1` },
      2: { baseUrl: `${baseUrl}/v2` },
    };
  }

  getEndpointUrl(endpoint: string, version = 1, hasNameSpace = false): string {
    const baseUrl = this.config[version].baseUrl;
    const url = hasNameSpace
      ? `${baseUrl}/${this.nameSpace}/${endpoint}`
      : `${baseUrl}/${endpoint}`;
    return url.replace(/\/+$/, "");
  }

  /**
   * Given a search term, return an array of matching search results (v2 only).
   * Documentation: https://api.snapcraft.io/docs/charms.html#charm_find
   */
  async find(options: PublisherFindOptions = {}): Promise<JsonObject> {
    const {
      query = "",
      category = "",
      publisher = "",
      type,
      provides = [],
      requires = [],
      fields = [],
    } = options;

    const url = this.getEndpointUrl(`${this.nameSpace}s/find`, 2);
    const params: Record<string, string> = {
      q: query,
      category,
      publisher,
    };
    if (type !== undefined) {
      params.type = type;
    }
    if (fields.length) {
      params.fields = fields.join(",");
    }
    if (provides.length) {
      params.provides = provides.join(",");
    }
    if (requires.length) {
      params.requires = requires.join(",");
    }

    return this.processResponse(
      await this.session.get(url, { params }),
    ) as JsonObject;
  }

  /**
   * Documentation: https://api.snapcraft.io/docs/categories.html
   */
  async getCategories(
    options: PublisherCategoriesOptions = {},
  ): Promise<JsonObject> {
    const { apiVersion = 2, type = "shared" } = options;
    const url = this.getEndpointUrl("charms/categories", apiVersion);
    return this.processResponse(
      await this.session.get(url, { params: { type } }),
    ) as JsonObject;
  }

  /**
   * Get libraries for a charm.
   * Documentation: https://api.charmhub.io/docs/libraries.html#fetch_libraries
   */
  async getCharmLibraries(packageName: string): Promise<JsonObject> {
    const url = this.getEndpointUrl("libraries/bulk", 1, true);
    return this.processResponse(
      await this.session.post(url, { json: [{ "charm-name": packageName }] }),
    ) as JsonObject;
  }

  /**
   * Get library metadata and content.
   * Documentation: https://api.charmhub.io/docs/libraries.html#fetch_library
   */
  async getCharmLibrary(
    charmName: string,
    libraryId: string,
    apiVersion?: number,
  ): Promise<JsonObject> {
    const params: Record<string, number> = {};
    if (apiVersion !== undefined) {
      params.api = apiVersion;
    }
    const url = this.getEndpointUrl(
      `charm/libraries/${charmName}/${libraryId}`,
    );
    return this.processResponse(
      await this.session.get(url, { params }),
    ) as JsonObject;
  }

  /**
   * Documentation: https://api.snapcraft.io/docs/info.html
   */
  async getItemDetails(
    name: string,
    options: PublisherItemDetailsOptions = {},
  ): Promise<JsonObject> {
    const { channel, fields = [], apiVersion = 2 } = options;
    const url = this.getEndpointUrl(
      `${this.nameSpace}s/info/${name}`,
      apiVersion,
    );
    const params: Record<string, string> = {};
    if (fields.length) {
      params.fields = fields.join(",");
    }
    if (channel) {
      params.channel = channel;
    }
    return this.processResponse(
      await this.session.get(url, { params }),
    ) as JsonObject;
  }
}
