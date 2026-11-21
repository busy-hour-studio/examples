/**
 * The BusyHour API's JSON shapes, as documented at https://docs.busyhour.id.
 * Only the fields these examples use are spelled out; the API may return more.
 */

/** A single resource: `{ data }`. */
export interface Resource<T> {
  data: T;
}

/** A page of a list: `{ data, meta }`. Pass `meta.nextCursor` back to get the
 *  next page (as `?after=` for most lists, `?before=` for message history). */
export interface Page<T, TCursor = string> {
  data: T[];
  meta: { nextCursor: TCursor | null; hasMore: boolean };
}

/** HTTP methods the API uses. */
export const HttpMethod = {
  GET: "GET",
  POST: "POST",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

/** The body of every error response. */
export interface ApiErrorBody {
  error: { code: string; message: string };
}

// ── Users & sessions ─────────────────────────────────────────────────────────

export interface User {
  id: string;
  projectId: string;
  /** Your own id for this user (from your auth system). */
  externalId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  attributes: Record<string, unknown>;
  createdAt: string;
}

/** The compact profile embedded on activities, comments, messages and
 *  members, so you can render an author without a separate lookup. */
export interface UserSummary {
  id: string;
  externalId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

/** What `POST /v1/sessions` returns: a short-lived token for one end user. */
export interface Session {
  token: string;
  expiresAt: string;
  user: User;
}

/** A follow (or block / mute) relationship, with the other user inline. */
export interface Relationship {
  kind: string;
  createdAt: string;
  user: User;
}

export interface FollowCounts {
  followers: number;
  following: number;
}

// ── Conversations & messages ─────────────────────────────────────────────────

/** A member's role in a conversation. */
export const ConversationRole = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export type ConversationRole =
  (typeof ConversationRole)[keyof typeof ConversationRole];

/** Messages people send, versus messages the API writes (joins, leaves,
 *  renames). */
export const MessageType = {
  USER: "user",
  SYSTEM: "system",
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export interface Conversation {
  id: string;
  name?: string | null;
  description?: string | null;
  attributes: Record<string, unknown>;
  latestSequence: number;
  lastMessageAt: string | null;
  lastMessage: {
    messageId: string;
    sequence: number;
    senderId: string | null;
    body: string;
    deleted: boolean;
  } | null;
  memberCount: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** One row of `GET /v1/conversations`: the conversation plus the caller's
 *  read state in it. */
export interface ConversationListItem {
  conversation: Conversation;
  role: ConversationRole;
  lastReadSequence: number;
  unreadCount: number;
}

export interface Member {
  id: string;
  userId: string;
  /** The member's profile. */
  user: UserSummary;
  role: ConversationRole;
  joinedAt: string;
  lastReadSequence: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string | null;
  /** The sender's profile; `null` for system messages and deleted users. */
  sender: UserSummary | null;
  /** Per-conversation, gap-free ordering. History pages by it. */
  sequence: number;
  externalId: string;
  type: MessageType;
  body: string;
  attachments: unknown[];
  reactionCounts: Record<string, number>;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
}

// ── Activities, comments & reactions ─────────────────────────────────────────

export interface Activity {
  id: string;
  userId: string;
  /** The author's profile; `null` if they've been deleted. */
  user: UserSummary | null;
  /** What kind of activity this is, e.g. `post`. You choose the verbs. */
  verb: string;
  body: string;
  attachments: unknown[];
  attributes: Record<string, unknown>;
  /** Per-type totals, e.g. `{ like: 3 }`, returned on every read. */
  reactionCounts: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  activityId: string;
  userId: string;
  /** The commenter's profile; `null` if they've been deleted. */
  user: UserSummary | null;
  parentId?: string | null;
  body: string;
  reactionCounts: Record<string, number>;
  replyCount: number;
  createdAt: string;
}

export interface Reaction {
  id: string;
  targetType: string;
  targetId: string;
  userId: string;
  type: string;
  createdAt: string;
}

/** What adding or removing a reaction returns: the reaction and fresh counts. */
export interface ReactionResult {
  reaction: Reaction | null;
  counts: Record<string, number>;
}

/** Everything about a target's reactions in one read. */
export interface ReactionSummary {
  /** Per-type totals, e.g. `{ like: 3 }`. */
  counts: Record<string, number>;
  groups: { type: string; count: number }[];
  /** A few of the most recent reactions per type. */
  latest: Record<string, Reaction[]>;
  /** The caller's own reactions. */
  own: Reaction[];
}

/** The things that can be reacted to, as they appear in the URL. */
export const ReactionTarget = {
  ACTIVITY: "activities",
  COMMENT: "comments",
  MESSAGE: "messages",
} as const;

export type ReactionTarget =
  (typeof ReactionTarget)[keyof typeof ReactionTarget];

// ── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title?: string | null;
  body?: string | null;
  /** Your own payload, e.g. a deep link. */
  data: Record<string, unknown>;
  readAt?: string | null;
  createdAt: string;
}

/** A device's platform, for push. */
export const DevicePlatform = {
  ANDROID: "android",
  IOS: "ios",
  WEB: "web",
} as const;

export type DevicePlatform =
  (typeof DevicePlatform)[keyof typeof DevicePlatform];

/** Who a notification goes to. */
export const NotificationAudience = {
  /** The users listed in `userIds`. */
  USERS: "users",
  /** Every user in the project. */
  PROJECT: "project",
} as const;

export type NotificationAudience =
  (typeof NotificationAudience)[keyof typeof NotificationAudience];

/** A notification send's progress: `pending` while it fans out, then `done`. */
export const NotificationSendStatus = {
  PENDING: "pending",
  DONE: "done",
} as const;

export type NotificationSendStatus =
  (typeof NotificationSendStatus)[keyof typeof NotificationSendStatus];

/** What `sendNotification` returns. */
export interface NotificationSend {
  id: string;
  status: NotificationSendStatus;
}
