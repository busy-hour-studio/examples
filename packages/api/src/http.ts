import { type ApiErrorBody, HttpMethod } from "./types";

export const DEFAULT_BASE_URL = "https://api.busyhour.id";

/** The `code` used when an error response has no JSON body (a proxy error,
 *  say). */
export const UNKNOWN_ERROR_CODE = "unknown_error";

/** Thrown for any non-2xx response, with the API's error `code` and message. */
export class BusyHourError extends Error {
  override readonly name = "BusyHourError";

  public constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export interface RequestOptions {
  baseUrl: string;
  /** `x-api-key` (server) or `Authorization: Bearer` (end user) headers. */
  headers: Record<string, string>;
  method?: HttpMethod;
  /** Sent as JSON. */
  body?: unknown;
  /** Query string values; `undefined` entries are skipped. */
  query?: Record<string, string | number | boolean | undefined>;
}

/** One call to the API: JSON in, JSON out, errors thrown as `BusyHourError`. */
export async function request<T>(
  path: string,
  options: RequestOptions
): Promise<T> {
  const url = new URL(path, options.baseUrl);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    method: options.method ?? HttpMethod.GET,
    headers: {
      ...options.headers,
      ...(options.body === undefined
        ? {}
        : { "content-type": "application/json" }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  // 204 No Content (mark read, unfollow, …) has no body to parse.
  const text = await response.text();
  const json: unknown = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const error = (json as ApiErrorBody | undefined)?.error;
    throw new BusyHourError(
      response.status,
      error?.code ?? UNKNOWN_ERROR_CODE,
      error?.message ?? `${response.status} ${response.statusText}`
    );
  }

  return json as T;
}

/** A unique id for idempotent creates. Retrying a send with the same
 *  `externalId` never posts the message twice. */
export function newExternalId(): string {
  // crypto.randomUUID exists in browsers, Node, Bun and Deno. React Native's
  // Hermes engine doesn't have it, hence the fallback.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
