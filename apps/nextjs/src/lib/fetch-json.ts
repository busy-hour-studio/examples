import { type ApiErrorBody, HttpMethod } from "@examples/api";
import type { ApiRoute } from "./constants";

/**
 * POST JSON to one of this app's own route handlers. When the user is signed
 * in, pass their session token so the route can verify who's calling.
 */
export async function postJson<T>(
  route: ApiRoute,
  body: unknown,
  token?: string
): Promise<T> {
  const response = await fetch(route, {
    method: HttpMethod.POST,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as T | ApiErrorBody;
  if (!response.ok) {
    throw new Error((json as ApiErrorBody).error.message);
  }
  return json as T;
}
