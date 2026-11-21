import { type ApiCall, unwrap } from "./http";
import {
  type DevicePlatform,
  HttpMethod,
  type Notification,
  type Page,
} from "./types";
import type { PageParams } from "./users";

/** The signed-in user's notification inbox and push devices. Notifications are
 *  sent from your backend, with `createServerClient().sendNotification`. */
export function notificationsApi(call: ApiCall) {
  return {
    /** The caller's inbox, newest first. */
    list: (page: PageParams = {}) =>
      call<Page<Notification>>("/v1/notifications", { query: { ...page } }),

    unreadCount: async () =>
      (
        await unwrap(
          call<{ data: { count: number } }>("/v1/notifications/unread-count")
        )
      ).count,

    markRead: (notificationId: string) =>
      call<undefined>("/v1/notifications/read", {
        method: HttpMethod.POST,
        body: { id: notificationId },
      }),

    markAllRead: () =>
      call<undefined>("/v1/notifications/read-all", {
        method: HttpMethod.POST,
      }),

    /** Remove one notification from the caller's inbox. */
    dismiss: (notificationId: string) =>
      call<undefined>(`/v1/notifications/${notificationId}`, {
        method: HttpMethod.DELETE,
      }),

    /** Register this device's FCM token so notifications sent with `push: true`
     *  reach it. Needs Firebase set up for the project in the console. */
    registerDevice: (input: { token: string; platform: DevicePlatform }) =>
      call<undefined>("/v1/device-tokens", {
        method: HttpMethod.POST,
        body: input,
      }),

    /** Stop pushing to a device, e.g. on sign-out. */
    removeDevice: (token: string) =>
      call<undefined>("/v1/device-tokens", {
        method: HttpMethod.DELETE,
        body: { token },
      }),
  };
}
