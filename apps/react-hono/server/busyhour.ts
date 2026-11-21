import {
  BusyHourError,
  createServerClient,
  createUserClient,
  type User,
} from "@examples/api";
import { createMiddleware } from "hono/factory";
import { validator } from "hono/validator";
import { AppErrorCode } from "./constants";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env.local.`);
  }
  return value;
}

/** The API base URL for server-side calls (defaults to production). */
const baseUrl = process.env.BUSYHOUR_API_URL;

/** BusyHour calls made with the project's API key. Only this server ever
 *  reads the key; the browser never sees it. */
export function busyhourServer() {
  return createServerClient({
    apiKey: requireEnv("BUSYHOUR_API_KEY"),
    projectId: requireEnv("BUSYHOUR_PROJECT_ID"),
    baseUrl,
  });
}

/**
 * Who is calling? The browser sends its BusyHour session token as
 * `Authorization: Bearer <token>`; asking the API for `/v1/users/me` with it
 * both verifies the token and tells us the user. A forged token fails here.
 * Routes behind this middleware read the user with `c.get("caller")`.
 */
export const requireCaller = createMiddleware<{
  Variables: { caller: User };
}>(async (c, next) => {
  const token = c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new BusyHourError(401, AppErrorCode.UNAUTHORIZED, "Sign in first.");
  }
  c.set("caller", await createUserClient({ token, baseUrl }).users.me());
  await next();
});

/** Turn a display name into a stable `externalId`, e.g. "Ada L." → "ada-l".
 *  In a real app this would be the user's id from your own auth system. */
export function externalIdFor(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function invalid(message: string): BusyHourError {
  return new BusyHourError(400, AppErrorCode.INVALID_REQUEST, message);
}

/** A JSON body with a non-empty `name`. */
export const nameBody = validator("json", (value: { name?: unknown }) => {
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name || !externalIdFor(name)) {
    throw invalid("Enter a name with at least one letter or digit.");
  }
  return { name };
});

/** A notification to send. */
export interface NotifyInput {
  title: string;
  body?: string;
  /** Who to notify. Omit it to notify yourself (the inbox's test button). */
  userId?: string;
}

/** A JSON body with a notification's title, and optionally body and user. */
export const notifyBody = validator(
  "json",
  (value: {
    userId?: unknown;
    title?: unknown;
    body?: unknown;
  }): NotifyInput => {
    if (typeof value.title !== "string" || !value.title) {
      throw invalid("title is required");
    }
    return {
      title: value.title,
      userId: typeof value.userId === "string" ? value.userId : undefined,
      body: typeof value.body === "string" ? value.body : undefined,
    };
  }
);
