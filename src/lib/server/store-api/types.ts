/**
 * Shared types for the store API clients.
 */

import type { StoreApiLogger } from "./base";
import type { FetchLike } from "./http";

/** Per-API-version configuration (base URL + default headers). */
export interface ApiVersionConfig {
  baseUrl: string;
  headers: Record<string, string>;
}

/** Map of API version number to its configuration. */
export type ApiConfig = Record<number, ApiVersionConfig>;

/**
 * Options accepted by every client constructor. Mirrors the Python clients'
 * injected `requests.Session` while keeping the transport swappable for tests.
 */
export interface ClientOptions {
  /** `fetch`-compatible transport. Defaults to the global `fetch`. */
  fetch?: FetchLike;
  /** Logger for detailed error reporting. Defaults to the app logger. */
  logger?: StoreApiLogger;
}

/** A generic JSON object response. */
export type JsonObject = Record<string, unknown>;
