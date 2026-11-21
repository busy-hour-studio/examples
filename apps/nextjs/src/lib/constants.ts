/** The app's pages. */
export const AppRoute = {
  HOME: "/",
  CHAT: "/chat",
  FEED: "/feed",
  INBOX: "/inbox",
} as const;

export type AppRoute = (typeof AppRoute)[keyof typeof AppRoute];

/** This app's own backend routes (Next.js route handlers in `src/app/api`). */
export const ApiRoute = {
  SESSION: "/api/session",
  USERS: "/api/users",
  NOTIFY: "/api/notify",
} as const;

export type ApiRoute = (typeof ApiRoute)[keyof typeof ApiRoute];

/** Error codes this app's own route handlers return (API errors pass through
 *  with the API's code). */
export const AppErrorCode = {
  UNAUTHORIZED: "unauthorized",
  INVALID_REQUEST: "invalid_request",
  INTERNAL: "internal_error",
} as const;

export type AppErrorCode = (typeof AppErrorCode)[keyof typeof AppErrorCode];

/** Activity verbs this app posts. BusyHour lets you choose your own. */
export const ActivityVerb = {
  POST: "post",
} as const;

export type ActivityVerb = (typeof ActivityVerb)[keyof typeof ActivityVerb];

/** Reaction types this app uses. Also yours to choose. */
export const ReactionType = {
  LIKE: "like",
} as const;

export type ReactionType = (typeof ReactionType)[keyof typeof ReactionType];

/** The feed's two views. */
export const FeedTab = {
  ALL: "all",
  FOLLOWING: "following",
} as const;

export type FeedTab = (typeof FeedTab)[keyof typeof FeedTab];

/** Keys this app stores in the browser. */
export const StorageKey = {
  SESSION: "busyhour-example:session",
} as const;

/** A window event the inbox fires when its contents change, so the rail's
 *  unread count updates right away. */
export const INBOX_CHANGED_EVENT = "busyhour-example:inbox-changed";

/** How often the nav re-checks the unread notification count. */
export const UNREAD_POLL_MS = 15_000;
