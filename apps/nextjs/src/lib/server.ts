import "server-only";
import {
  BusyHourError,
  createServerClient,
  createUserClient,
} from "@examples/api";
import type { User } from "@examples/api";
import { AppErrorCode } from "./constants";

// `server-only` makes the build fail if this file is ever imported into client
// code, so the API key can't leak into the browser bundle.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env.local.`);
  }
  return value;
}

/** The API base URL for server-side calls (defaults to production). */
const baseUrl = process.env.BUSYHOUR_API_URL;

/** BusyHour calls made with the project's API key. */
export function busyhourServer() {
  return createServerClient({
    apiKey: requireEnv("BUSYHOUR_API_KEY"),
    projectId: requireEnv("BUSYHOUR_PROJECT_ID"),
    baseUrl,
  });
}

/**
 * Who is calling this route? The browser sends its BusyHour session token as
 * `Authorization: Bearer <token>`; asking the API for `/v1/users/me` with it
 * both verifies the token and tells us the user. A forged token fails here.
 */
export async function requireCaller(request: Request): Promise<User> {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new BusyHourError(401, AppErrorCode.UNAUTHORIZED, "Sign in first.");
  }
  return createUserClient({ token, baseUrl }).users.me();
}

/** Turn a display name into a stable `externalId`, e.g. "Ada L." → "ada-l".
 *  In a real app this would be the user's id from your own auth system. */
export function externalIdFor(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Read a non-empty `name` from a JSON body, or throw a 400. */
export async function readName(request: Request): Promise<string> {
  const body = (await request.json().catch(() => ({}))) as { name?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || !externalIdFor(name)) {
    throw new BusyHourError(
      400,
      AppErrorCode.INVALID_REQUEST,
      "Enter a name with at least one letter or digit."
    );
  }
  return name;
}

/** A JSON error response, keeping the API's status and message. */
export function errorResponse(error: unknown): Response {
  if (error instanceof BusyHourError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  }
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json(
    { error: { code: AppErrorCode.INTERNAL, message } },
    { status: 500 }
  );
}
