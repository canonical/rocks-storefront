/**
 * Error hierarchy for the store API clients.
 *
 * Mirrors `canonicalwebteam/exceptions.py` from the Python package so that
 * developers migrating from Python encounter the same exception types with the
 * same inheritance relationships. `instanceof StoreApiError` remains the
 * catch-all, exactly like the Python base class.
 */

/** Base exception for any errors in the API layer. */
export class StoreApiError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Communication with the API failed. */
export class StoreApiConnectionError extends StoreApiError {}

/** Store API internal error (HTTP 500). */
export class StoreApiInternalError extends StoreApiConnectionError {}

/** Store API doesn't implement this method (HTTP 501). */
export class StoreApiNotImplementedError extends StoreApiConnectionError {}

/** Got an invalid response from the Store API (HTTP 502). */
export class StoreApiBadGatewayError extends StoreApiConnectionError {}

/** Store API is not available (HTTP 503). */
export class StoreApiServiceUnavailableError extends StoreApiConnectionError {}

/** Request to the Store API timed out (HTTP 504). */
export class StoreApiGatewayTimeoutError extends StoreApiConnectionError {}

/** The requested resource is not found. */
export class StoreApiResourceNotFound extends StoreApiError {}

/** Communication with the API timed out. */
export class StoreApiTimeoutError extends StoreApiError {}

/** We failed to properly decode the response from the API. */
export class StoreApiResponseDecodeError extends StoreApiError {}

/** The API responded with an error. */
export class StoreApiResponseError extends StoreApiError {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

/** A single error entry as returned in an API `error_list`/`error-list`. */
export interface StoreApiErrorEntry {
  code: string;
  message: string;
  [key: string]: unknown;
}

/**
 * The API responded with a list of errors, which are included in `errors`.
 */
export class StoreApiResponseErrorList extends StoreApiResponseError {
  errors: StoreApiErrorEntry[];

  constructor(
    message: string,
    statusCode: number,
    errors: StoreApiErrorEntry[],
  ) {
    super(message, statusCode);
    this.errors = errors;
  }
}

export class StoreApiCircuitBreaker extends StoreApiError {}

/** The user needs to sign the agreement. */
export class PublisherAgreementNotSigned extends StoreApiError {}

/** The user hasn't registered a username. */
export class PublisherMissingUsername extends StoreApiError {}

/** The macaroon needs to be refreshed. */
export class PublisherMacaroonRefreshRequired extends StoreApiError {}
