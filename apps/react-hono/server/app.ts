import { BusyHourError, NotificationAudience } from "@examples/api";
import { Hono } from "hono";
import {
  busyhourServer,
  externalIdFor,
  nameBody,
  notifyBody,
  requireCaller,
} from "./busyhour";
import { AppErrorCode } from "./constants";

/**
 * This app's backend: the only code that holds the BusyHour API key. The
 * browser calls these routes with Hono's typed client (`src/lib/backend.ts`),
 * and everything else straight on the BusyHour API with the user's token.
 *
 * Routes are chained so `AppType` carries every route's input and output.
 */
export const app = new Hono()
  .basePath("/api")
  /**
   * Sign in: mint a BusyHour session token for the user.
   *
   * This demo signs you in by name. In a real app, this route would sit
   * behind your own auth and use the signed-in user's id as `externalId`.
   * BusyHour creates the user on first sign-in, so there's no sign-up call.
   */
  .post("/session", nameBody, async (c) => {
    const { name } = c.req.valid("json");
    const session = await busyhourServer().createSession({
      externalId: externalIdFor(name),
      displayName: name,
    });
    return c.json(session);
  })
  /**
   * Find (or create) the user with this name and return their BusyHour id,
   * so the caller can start a DM with them, even if they've never signed in.
   */
  .post("/users", requireCaller, nameBody, async (c) => {
    const { name } = c.req.valid("json");
    const user = await busyhourServer().upsertUser({
      externalId: externalIdFor(name),
      displayName: name,
    });
    return c.json({ id: user.id, displayName: user.displayName });
  })
  /**
   * Send a notification to one user. Notifications are sent with the API
   * key, so they go through your backend. The caller is verified first, so a
   * browser can't send notifications as someone else.
   */
  .post("/notify", requireCaller, notifyBody, async (c) => {
    const caller = c.get("caller");
    const input = c.req.valid("json");
    const sent = await busyhourServer().sendNotification({
      audience: NotificationAudience.USERS,
      userIds: [input.userId ?? caller.id],
      title: input.title,
      body: input.body,
      data: { fromUserId: caller.id },
    });
    return c.json(sent);
  })
  // An unknown `/api/*` path is a JSON 404, not the React app's page.
  .all("*", (c) =>
    c.json(
      { error: { code: AppErrorCode.NOT_FOUND, message: "No such route." } },
      404
    )
  )
  // One error shape for every route: `{ error: { code, message } }`, keeping
  // the API's status and message when a BusyHour call fails.
  .onError((error, c) => {
    if (error instanceof BusyHourError) {
      return c.json(
        { error: { code: error.code, message: error.message } },
        error.status as 400
      );
    }
    console.error(error);
    return c.json(
      { error: { code: AppErrorCode.INTERNAL, message: error.message } },
      500
    );
  });

export type AppType = typeof app;
