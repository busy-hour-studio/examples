import { DEFAULT_BASE_URL, request } from "./http";
import {
  HttpMethod,
  type NotificationAudience,
  type NotificationSend,
  type Resource,
  type Session,
} from "./types";

export interface ServerClientOptions {
  /** Your project's API key. Keep it on the server, never ship it to a client. */
  apiKey: string;
  /** The project the API key belongs to. */
  projectId: string;
  baseUrl?: string;
}

export interface CreateSessionInput {
  /** Your own id for the user, e.g. the id from your auth system. The user is
   *  created on first use, so there's no separate sign-up call. */
  externalId: string;
  displayName?: string;
  avatarUrl?: string;
}

export type SendNotificationInput = {
  title?: string;
  body?: string;
  /** Your own payload, e.g. `{ deepLink: "/orders/42" }`. */
  data?: Record<string, unknown>;
  /** Also push it to the users' devices (needs Firebase set up in the console). */
  push?: boolean;
} & (
  | { audience: typeof NotificationAudience.USERS; userIds: string[] }
  | { audience: typeof NotificationAudience.PROJECT }
);

/**
 * Calls made with your API key. Use them from your backend only: mint session
 * tokens for your signed-in users, and trigger notifications.
 */
export function createServerClient(options: ServerClientOptions) {
  const call = <T>(
    path: string,
    init: Omit<Parameters<typeof request>[1], "baseUrl" | "headers">
  ) =>
    request<T>(path, {
      ...init,
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      headers: { "x-api-key": options.apiKey },
    });

  return {
    /** A short-lived session token for one of your users. Hand it to their
     *  client, which calls the API with it directly. */
    async createSession(input: CreateSessionInput): Promise<Session> {
      const res = await call<Resource<Session>>("/v1/sessions", {
        method: HttpMethod.POST,
        body: { projectId: options.projectId, ...input },
      });
      return res.data;
    },

    /** Notify some users, or everyone in the project. It lands in their inbox
     *  right away; the fan-out to many users happens in the background. */
    async sendNotification(
      input: SendNotificationInput
    ): Promise<NotificationSend> {
      const { audience, title, body, data, push } = input;
      const res = await call<Resource<NotificationSend>>("/v1/notifications", {
        method: HttpMethod.POST,
        body: {
          projectId: options.projectId,
          audience,
          audienceUserIds: "userIds" in input ? input.userIds : undefined,
          title,
          body,
          data,
          push,
        },
      });
      return res.data;
    },
  };
}

export type ServerClient = ReturnType<typeof createServerClient>;
