/**
 * Shared base class for the store API clients.
 *
 * Ports `canonicalwebteam/store_api/base.py`. {@link Base.processResponse}
 * reproduces the Python `process_response` control flow exactly: 5xx responses
 * map to typed connection errors, JSON decode failures raise
 * {@link StoreApiResponseDecodeError}, macaroon-refresh signals raise
 * {@link PublisherMacaroonRefreshRequired}, and API error payloads are unpacked
 * into the appropriate {@link StoreApiResponseError} subtype.
 */

import { logger as defaultLogger } from "../logger";
import {
  PublisherAgreementNotSigned,
  PublisherMacaroonRefreshRequired,
  PublisherMissingUsername,
  StoreApiBadGatewayError,
  StoreApiConnectionError,
  type StoreApiErrorEntry,
  StoreApiGatewayTimeoutError,
  StoreApiInternalError,
  StoreApiNotImplementedError,
  StoreApiResourceNotFound,
  StoreApiResponseDecodeError,
  StoreApiResponseError,
  StoreApiResponseErrorList,
  StoreApiServiceUnavailableError,
} from "./exceptions";
import type { HttpSession, StoreHttpResponse } from "./http";

/** Minimal logger contract satisfied by pino and by test doubles. */
export interface StoreApiLogger {
  error(obj: object, msg?: string): void;
}

/** Replace string values with a length marker; null everything else. */
function sanitizeHeaders(
  headers: Record<string, string>,
): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = typeof value === "string" ? `<len ${value.length}>` : null;
  }
  return result;
}

function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class Base {
  protected session: HttpSession;
  protected logger: StoreApiLogger;

  constructor(session: HttpSession, logger: StoreApiLogger = defaultLogger) {
    this.session = session;
    this.logger = logger;
  }

  protected logDetailedError(response: StoreHttpResponse): void {
    this.logger.error(
      {
        request: {
          url: response.request.url,
          headers: sanitizeHeaders(response.request.headers),
          body: response.request.body,
        },
        response: {
          status: response.status,
          url: response.url,
          headers: sanitizeHeaders(headersToObject(response.headers)),
          text: response.text,
        },
      },
      "Request failed",
    );
  }

  processResponse(response: StoreHttpResponse): unknown {
    // 5xx responses are not in JSON format.
    if (response.status >= 500) {
      this.logDetailedError(response);
      switch (response.status) {
        case 500:
          throw new StoreApiInternalError("Internal error upstream");
        case 501:
          throw new StoreApiNotImplementedError(
            "Service doesn't implement this method",
          );
        case 502:
          throw new StoreApiBadGatewayError("Invalid response from upstream");
        case 503:
          throw new StoreApiServiceUnavailableError("Service is unavailable");
        case 504:
          throw new StoreApiGatewayTimeoutError("Upstream request timed out");
        default:
          throw new StoreApiConnectionError(
            `Service unavailable, code ${response.status}`,
          );
      }
    }

    let body: unknown;
    try {
      body = response.json();
    } catch (decodeError) {
      this.logger.error({ text: response.text }, "JSON decoding failed");
      throw new StoreApiResponseDecodeError(
        `JSON decoding failed: ${(decodeError as Error).message}`,
      );
    }

    if (this.isMacaroonExpired(response.headers)) {
      this.logger.error({}, "Publisher macaroon refresh required");
      throw new PublisherMacaroonRefreshRequired();
    }

    if (!response.ok) {
      if (this.requiresMacaroonReauth(response, body)) {
        this.logger.error({}, "Publisher macaroon reauthentication required");
        throw new PublisherMacaroonRefreshRequired();
      }

      this.logDetailedError(response);

      const errorList = this.extractErrorList(body);
      if (errorList) {
        for (const error of errorList) {
          if (error.code === "user-missing-latest-tos") {
            throw new PublisherAgreementNotSigned();
          }
          if (error.code === "user-not-ready") {
            if (error.message?.includes("has not signed agreement")) {
              throw new PublisherAgreementNotSigned();
            }
            if (error.message?.includes("username")) {
              throw new PublisherMissingUsername();
            }
          }
          if (error.code === "resource-not-found") {
            throw new StoreApiResourceNotFound();
          }
        }

        throw new StoreApiResponseErrorList(
          "The api returned a list of errors",
          response.status,
          errorList,
        );
      }

      if (!body) {
        throw new StoreApiResponseError(
          "Unknown error from api",
          response.status,
        );
      }

      let message: string | undefined;
      if (isRecord(body)) {
        // Fall back to `message` when `Message` is falsy (incl. empty string),
        // matching the Python client's `if not message` behavior.
        message =
          (body.Message as string | undefined) ||
          (body.message as string | undefined);
      }
      throw new StoreApiResponseError(
        message || "Unknown error from api",
        response.status,
      );
    }

    return body;
  }

  /**
   * Returns true if the macaroon needs to be refreshed based on the
   * `WWW-Authenticate` response header.
   */
  protected isMacaroonExpired(headers: Headers): boolean {
    return headers.get("WWW-Authenticate") === "Macaroon needs_refresh=1";
  }

  protected requiresMacaroonReauth(
    response: StoreHttpResponse,
    body: unknown,
  ): boolean {
    if (response.status !== 401) {
      return false;
    }
    if (!isRecord(body)) {
      return false;
    }
    const errorCode = String(body.Code ?? "").toLowerCase();
    const message = String(body.Message ?? "").toLowerCase();
    return (
      errorCode.includes("macaroon") || message.includes("discharge required")
    );
  }

  private extractErrorList(body: unknown): StoreApiErrorEntry[] | null {
    if (!isRecord(body)) {
      return null;
    }
    const list = body.error_list ?? body["error-list"];
    return Array.isArray(list) ? (list as StoreApiErrorEntry[]) : null;
  }
}
