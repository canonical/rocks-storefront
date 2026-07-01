/**
 * TypeScript port of `canonicalwebteam.store-api`.
 *
 * First pass: public, unauthenticated clients only. See `./README.md` for the
 * Python → TypeScript migration mapping and the list of deferred features
 * (macaroon auth, the Dashboard client, redis, snap recommendations, retries).
 */

export type { StoreApiLogger } from "./base";
export { Base } from "./base";
export type {
  CategoriesOptions,
  DeviceGWOptions,
  FeaturedSnapsOptions,
  FindOptions,
  ItemDetailsOptions,
  PaginationOptions,
  SearchOptions,
  SnapDetailsOptions,
} from "./devicegw";
export { DeviceGW } from "./devicegw";
export {
  PublisherAgreementNotSigned,
  PublisherMacaroonRefreshRequired,
  PublisherMissingUsername,
  StoreApiBadGatewayError,
  StoreApiCircuitBreaker,
  StoreApiConnectionError,
  StoreApiError,
  type StoreApiErrorEntry,
  StoreApiGatewayTimeoutError,
  StoreApiInternalError,
  StoreApiNotImplementedError,
  StoreApiResourceNotFound,
  StoreApiResponseDecodeError,
  StoreApiResponseError,
  StoreApiResponseErrorList,
  StoreApiServiceUnavailableError,
  StoreApiTimeoutError,
} from "./exceptions";
export type {
  FetchLike,
  LoggableRequest,
  QueryParams,
  RequestOptions,
  StoreHttpResponse,
} from "./http";
export { HttpSession } from "./http";
export type {
  PublisherCategoriesOptions,
  PublisherFindOptions,
  PublisherGWOptions,
  PublisherItemDetailsOptions,
} from "./publishergw";
export { PublisherGW } from "./publishergw";
export type {
  ApiConfig,
  ApiVersionConfig,
  ClientOptions,
  JsonObject,
} from "./types";
