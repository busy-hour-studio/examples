/** The app's pages. */
export const AppRoute = {
  HOME: "/",
  CHAT: "/chat",
  FEED: "/feed",
  INBOX: "/inbox",
} as const;

export type AppRoute = (typeof AppRoute)[keyof typeof AppRoute];

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

/** The BusyHour API the browser calls with the user's session token
 *  (defaults to production). */
export const API_URL = import.meta.env.VITE_BUSYHOUR_API_URL;
