import { type ApiCall, unwrap } from "./http";
import {
  type FollowCounts,
  HttpMethod,
  type Page,
  type Relationship,
  type User,
} from "./types";

/** List paging: pass the previous page's `meta.nextCursor` as `after`. */
export interface PageParams {
  limit?: number;
  after?: string;
}

/** The signed-in user's profile and who they follow. Following someone puts
 *  their posts in the caller's `following` feed. */
export function usersApi(call: ApiCall) {
  return {
    me: () => unwrap(call<{ data: User }>("/v1/users/me")),

    follow: (userId: string) =>
      call<unknown>(`/v1/users/${userId}/follow`, { method: HttpMethod.POST }),

    unfollow: (userId: string) =>
      call<undefined>(`/v1/users/${userId}/follow`, {
        method: HttpMethod.DELETE,
      }),

    /** Who a user follows; the caller when `userId` is omitted. */
    following: (userId = "me", page: PageParams = {}) =>
      call<Page<Relationship>>(`/v1/users/${userId}/following`, {
        query: { ...page },
      }),

    /** Who follows a user; the caller when `userId` is omitted. */
    followers: (userId = "me", page: PageParams = {}) =>
      call<Page<Relationship>>(`/v1/users/${userId}/followers`, {
        query: { ...page },
      }),

    /** Follower and following totals; the caller's when `userId` is omitted. */
    followCounts: (userId = "me") =>
      unwrap(call<{ data: FollowCounts }>(`/v1/users/${userId}/follow-counts`)),
  };
}
