import { type ApiCall, unwrap } from "./http";
import {
  type Activity,
  type Comment,
  HttpMethod,
  type Page,
  type ReactionResult,
  type ReactionSummary,
  type ReactionTarget,
} from "./types";
import type { PageParams } from "./users";

/** Filters for the feed. They combine: e.g. posts by people the caller
 *  follows. */
export interface FeedFilter extends PageParams {
  /** Only these authors. */
  userId?: string[];
  /** Only these kinds of activity, e.g. `["post"]`. */
  verb?: string[];
  /** Only authors the caller follows. */
  following?: boolean;
}

/** The activity feed, comments and reactions, as the signed-in user. */
export function feedsApi(call: ApiCall) {
  return {
    // ── Activities ───────────────────────────────────────────────────────────

    /** The project's activity feed, newest first. */
    list: (filter: FeedFilter = {}) =>
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

    get: (activityId: string) =>
      unwrap(call<{ data: Activity }>(`/v1/activities/${activityId}`)),

    /** Post to the feed as the caller. `attributes` is your own JSON, stored
     *  with the activity and returned on every read. */
    create: (input: {
      verb: string;
      body?: string;
      attributes?: Record<string, unknown>;
    }) =>
      unwrap(
        call<{ data: Activity }>("/v1/activities", {
          method: HttpMethod.POST,
          body: input,
        })
      ),

    /** Edit one of the caller's own activities. */
    update: (activityId: string, input: { verb?: string; body?: string }) =>
      unwrap(
        call<{ data: Activity }>(`/v1/activities/${activityId}`, {
          method: HttpMethod.PATCH,
          body: input,
        })
      ),

    /** Delete one of the caller's own activities. */
    delete: (activityId: string) =>
      call<unknown>(`/v1/activities/${activityId}`, {
        method: HttpMethod.DELETE,
      }),

    // ── Comments ─────────────────────────────────────────────────────────────

    /** Top-level comments; pass `parentId` for the replies to one comment. */
    comments: (
      activityId: string,
      filter: { parentId?: string } & PageParams = {}
    ) =>
      call<Page<Comment>>(`/v1/activities/${activityId}/comments`, {
        query: { ...filter, topLevel: filter.parentId ? undefined : true },
      }),

    getComment: (commentId: string) =>
      unwrap(call<{ data: Comment }>(`/v1/comments/${commentId}`)),

    /** Comment on an activity, or reply to a comment with `parentId`. */
    comment: (activityId: string, input: { body: string; parentId?: string }) =>
      unwrap(
        call<{ data: Comment }>(`/v1/activities/${activityId}/comments`, {
          method: HttpMethod.POST,
          body: input,
        })
      ),

    /** Edit one of the caller's own comments. */
    updateComment: (commentId: string, input: { body: string }) =>
      unwrap(
        call<{ data: Comment }>(`/v1/comments/${commentId}`, {
          method: HttpMethod.PATCH,
          body: input,
        })
      ),

    /** Delete one of the caller's own comments. */
    deleteComment: (commentId: string) =>
      call<unknown>(`/v1/comments/${commentId}`, {
        method: HttpMethod.DELETE,
      }),

    // ── Reactions (on activities, comments or messages) ──────────────────────

    /** Counts, the latest reactions per type, and the caller's own. */
    reactions: (target: ReactionTarget, id: string) =>
      unwrap(call<{ data: ReactionSummary }>(`/v1/${target}/${id}/reactions`)),

    /** React, e.g. `type: "like"`. Returns the reaction and fresh counts. */
    react: (target: ReactionTarget, id: string, type: string) =>
      unwrap(
        call<{ data: ReactionResult }>(`/v1/${target}/${id}/reactions`, {
          method: HttpMethod.POST,
          body: { type },
        })
      ),

    unreact: (target: ReactionTarget, id: string, type: string) =>
      unwrap(
        call<{ data: ReactionResult }>(`/v1/${target}/${id}/reactions`, {
          method: HttpMethod.DELETE,
          query: { type },
        })
      ),
  };
}
