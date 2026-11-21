import { chatApi } from "./chat";
import { feedsApi } from "./feeds";
import { type ApiCall, DEFAULT_BASE_URL, request } from "./http";
import { notificationsApi } from "./notifications";
import { usersApi } from "./users";

export interface UserClientOptions {
  /** A session token your backend minted with `createSession`. */
  token: string;
  baseUrl?: string;
}

/**
 * Calls made as one end user, with their session token. Safe to use from the
 * browser or a mobile app: the token only grants what that user may do.
 *
 * Grouped by feature: `users`, `chat`, `feeds`, `notifications`.
 */
export function createUserClient(options: UserClientOptions) {
  const call: ApiCall = (path, init = {}) =>
    request(path, {
      ...init,
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      headers: { authorization: `Bearer ${options.token}` },
    });

  return {
    users: usersApi(call),
    chat: chatApi(call),
    feeds: feedsApi(call),
    notifications: notificationsApi(call),
  };
}

export type UserClient = ReturnType<typeof createUserClient>;
