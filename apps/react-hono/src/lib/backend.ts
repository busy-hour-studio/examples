import type { ApiErrorBody } from "@examples/api";
import { hc } from "hono/client";
import type { AppType } from "../../server/app";

/**
 * This app's own backend (`server/app.ts`), through Hono's typed client:
 * paths, request bodies and responses all come from the server's routes.
 * Only the type is imported, so no server code reaches the browser.
 */
export const backend = hc<AppType>("/").api;

/** Pass the user's session token, so the route can verify who's calling. */
export function withToken(token: string) {
  return { headers: { authorization: `Bearer ${token}` } };
}

/** Read a backend response, throwing its error message on failure. */
export async function read<T>(
  call: Promise<{ ok: boolean; json: () => Promise<T> }>
): Promise<Exclude<T, ApiErrorBody>> {
  const response = await call;
  const json = await response.json();
  if (!response.ok) throw new Error((json as ApiErrorBody).error.message);
  return json as Exclude<T, ApiErrorBody>;
}
