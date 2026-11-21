import { DEFAULT_BASE_URL, newExternalId, request } from "./http";
import {
  type Activity,
  type Comment,
  type Conversation,
  type ConversationListItem,
  type FollowCounts,
  HttpMethod,
  type Member,
  type Message,
  type Notification,
  type Page,
  type ReactionResult,
  type ReactionTarget,
  type Resource,
  type User,
} from "./types";

export interface UserClientOptions {
  /** A session token your backend minted with `createSession`. */
  token: string;
  baseUrl?: string;
}

/** List paging: pass the previous page's `meta.nextCursor` as `after`. */
export interface PageParams {
  limit?: number;
  after?: string;
}

/**
 * Calls made as one end user, with their session token. Safe to use from the
 * browser or a mobile app: the token only grants what that user may do.
 */
export function createUserClient(options: UserClientOptions) {
  const call = <T>(
    path: string,
    init: Omit<Parameters<typeof request>[1], "baseUrl" | "headers"> = {}
  ) =>
    request<T>(path, {
      ...init,
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      headers: { authorization: `Bearer ${options.token}` },
    });

  const data = async <T>(promise: Promise<Resource<T>>) => (await promise).data;

  return {
    // ── Me ───────────────────────────────────────────────────────────────────

    me: () => data(call<Resource<User>>("/v1/users/me")),

    follow: (userId: string) =>
      call<unknown>(`/v1/users/${userId}/follow`, { method: HttpMethod.POST }),

    unfollow: (userId: string) =>
      call<undefined>(`/v1/users/${userId}/follow`, {
        method: HttpMethod.DELETE,
      }),

    followCounts: () =>
      data(call<Resource<FollowCounts>>("/v1/users/me/follow-counts")),

    // ── Chat ─────────────────────────────────────────────────────────────────

    /** The caller's conversations, most recent first, with unread counts. */
    listConversations: (page: PageParams = {}) =>
      call<Page<ConversationListItem>>("/v1/conversations", {
        query: { ...page },
      }),

    /** Start a conversation. A DM is just a conversation with one other
     *  member; the caller is always a member. */
    createConversation: (input: { name?: string; memberUserIds?: string[] }) =>
      data(
        call<Resource<{ conversation: Conversation; members: Member[] }>>(
          "/v1/conversations",
          { method: HttpMethod.POST, body: input }
        )
      ),

    getConversation: (conversationId: string) =>
      data(call<Resource<Conversation>>(`/v1/conversations/${conversationId}`)),

    /** Newest messages first. To load older ones, pass the previous page's
     *  `meta.nextCursor` (a sequence number) as `before`. */
    listMessages: (
      conversationId: string,
      page: { limit?: number; before?: number } = {}
    ) =>
      call<Page<Message, number>>(
        `/v1/conversations/${conversationId}/messages`,
        { query: { ...page } }
      ),

    /** Send a message. It reaches everyone connected to the conversation's
     *  WebSocket as a `message.created` event. Pass your own `externalId` to
     *  make retries safe; one is generated otherwise. */
    sendMessage: (
      conversationId: string,
      input: { body: string; externalId?: string }
    ) =>
      data(
        call<Resource<Message>>(
          `/v1/conversations/${conversationId}/messages`,
          {
            method: HttpMethod.POST,
            body: { ...input, externalId: input.externalId ?? newExternalId() },
          }
        )
      ),

    /** Mark everything up to `sequence` as read (clears the unread count). */
    markConversationRead: (conversationId: string, sequence: number) =>
      call<unknown>(`/v1/conversations/${conversationId}/read`, {
        method: HttpMethod.POST,
        body: { sequence },
      }),

    // ── Feed ─────────────────────────────────────────────────────────────────

    /** The project's activity feed, newest first. Narrow it with comma lists
     *  of authors or verbs, or to the people the caller follows. */
    listActivities: (
      filter: {
        userId?: string[];
        verb?: string[];
        following?: boolean;
      } & PageParams = {}
    ) =>
      call<Page<Activity>>("/v1/activities", {
        query: {
          limit: filter.limit,
          after: filter.after,
          userId: filter.userId?.join(","),
          verb: filter.verb?.join(","),
          // send `following=true` only when asked; `false` is the default
          following: filter.following ? true : undefined,
        },
      }),

    /** Post to the feed as the caller. */
    createActivity: (input: { verb: string; body?: string }) =>
      data(
        call<Resource<Activity>>("/v1/activities", {
          method: HttpMethod.POST,
          body: input,
        })
      ),

    /** Top-level comments; pass `parentId` for the replies to one comment. */
    listComments: (
      activityId: string,
      filter: { parentId?: string } & PageParams = {}
    ) =>
      call<Page<Comment>>(`/v1/activities/${activityId}/comments`, {
        query: {
          ...filter,
          topLevel: filter.parentId ? undefined : true,
        },
      }),

    /** Comment on an activity, or reply to a comment with `parentId`. */
    createComment: (
      activityId: string,
      input: { body: string; parentId?: string }
    ) =>
      data(
        call<Resource<Comment>>(`/v1/activities/${activityId}/comments`, {
          method: HttpMethod.POST,
          body: input,
        })
      ),

    /** React to an activity, comment or message, e.g. `type: "like"`. */
    react: (target: ReactionTarget, id: string, type: string) =>
      data(
        call<Resource<ReactionResult>>(`/v1/${target}/${id}/reactions`, {
          method: HttpMethod.POST,
          body: { type },
        })
      ),

    unreact: (target: ReactionTarget, id: string, type: string) =>
      data(
        call<Resource<ReactionResult>>(`/v1/${target}/${id}/reactions`, {
          method: HttpMethod.DELETE,
          query: { type },
        })
      ),

    // ── Notifications ────────────────────────────────────────────────────────

    /** The caller's notification inbox, newest first. */
    listNotifications: (page: PageParams = {}) =>
      call<Page<Notification>>("/v1/notifications", { query: { ...page } }),

    unreadNotificationCount: async () =>
      (
        await data(
          call<Resource<{ count: number }>>("/v1/notifications/unread-count")
        )
      ).count,

    markNotificationRead: (notificationId: string) =>
      call<undefined>("/v1/notifications/read", {
        method: HttpMethod.POST,
        body: { id: notificationId },
      }),

    markAllNotificationsRead: () =>
      call<undefined>("/v1/notifications/read-all", {
        method: HttpMethod.POST,
      }),
  };
}

export type UserClient = ReturnType<typeof createUserClient>;
