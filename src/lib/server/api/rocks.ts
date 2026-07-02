import {
  array,
  type BaseIssue,
  type BaseSchema,
  type InferInput,
  type InferOutput,
  literal,
  object,
  optional,
  parse,
  string,
  union,
} from "valibot";
import { env } from "$env/dynamic/private";
import type { RockFindResponse, RockInfoResponse } from "./types";

/**
 * Some validation utilities for API client inputs
 */
const FIELDS = [
  "categories",
  "contact",
  "description",
  "license",
  "links",
  "media",
  "private",
  "publisher",
  "summary",
  "title",
  "website",
  "created-at",
  "download",
  "version",
  "revision",
  "channel-map",
] as const;

export const getRocksSchema = object({
  query: optional(string(), "%"),
  categories: optional(array(string()), []),
  architecture: optional(array(string()), []),
  fields: optional(array(union(FIELDS.map((f) => literal(f)))), []),
});
export type GetRocksInput = InferInput<typeof getRocksSchema>;

export const getRockDetailsSchema = object({
  name: string(),
  fields: optional(array(union(FIELDS.map((f) => literal(f)))), FIELDS),
});
export type GetRockDetailsInput = InferInput<typeof getRockDetailsSchema>;

// Unused because of an issue introduced by Vite 8 which broke decorators
// (see https://github.com/oxc-project/oxc/issues/9170)
// A decorator factory for that parses incoming arguments against a schema
// before executing the actual class method it decorates; if input doesn't
// match the schema it will throw a ValiError exception
function _ValidateArgs<
  S extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(schema: S) {
  type InputS = InferInput<S> | InferOutput<S>;
  return <This, Args extends InputS, Return>(
    originalMethod: (this: This, args: Args) => Return,
  ) =>
    function (this: This, args: Args): Return {
      const validatedArgs = parse(schema, args) as Args;
      return originalMethod.apply(this, [validatedArgs]);
    };
}

/**
 * Actual API client implementation
 */

const API_BASE_URL = env.API_BASE_URL ?? "https://api.snapcraft.io/";
const NAMESPACE = "v2/rocks";

export class ApiClient {
  private getAbortSignal?: () => AbortSignal;

  constructor(getAbortSignal?: () => AbortSignal) {
    this.getAbortSignal = getAbortSignal;
  }

  private buildUrl(
    pathname: string,
    searchParams: Record<string, string> = {},
  ): URL {
    if (!pathname.includes(NAMESPACE)) {
      pathname = `${NAMESPACE}/${pathname}`.replaceAll("//", "/");
    }

    const url = new URL(pathname, API_BASE_URL);

    for (const key in searchParams) {
      if (searchParams[key]) url.searchParams.set(key, searchParams[key]);
    }

    return url;
  }

  private async request<T>(
    input: string | URL | Request,
    init: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(input, {
      ...init,
      signal: this.getAbortSignal?.(),
      // headers: { ...init?.headers, "Snap-Device-Series": "16" },
    });
    const result = (await response.json()) as T;
    return result;
  }

  // @ValidateArgs(getRocksSchema)
  async getRocks(input: GetRocksInput): Promise<RockFindResponse> {
    const { query, architecture, categories, fields } = parse(
      getRocksSchema,
      input,
    );

    const url = this.buildUrl(`find`, {
      q: query,
      fields: fields.join(","),
      architecture: architecture.join(","),
      categories: categories.join(","),
    });

    const result = await this.request<RockFindResponse>(url);

    return result;
  }

  // @ValidateArgs(getRockDetailsSchema)
  async getRockDetails(input: GetRockDetailsInput): Promise<RockInfoResponse> {
    const { name, fields } = parse(getRockDetailsSchema, input);
    const url = this.buildUrl(`info/${name}`, {
      fields: fields.join(","),
    });

    const result = await this.request<RockInfoResponse>(url);

    return result;
  }
}
