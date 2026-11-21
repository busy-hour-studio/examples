import { DEFAULT_BASE_URL } from "./http";
import type { Member, Message, Reaction } from "./types";

/** The conversation WebSocket's event names. */
export const ConversationEventName = {
  MESSAGE_CREATED: "message.created",
  MESSAGE_UPDATED: "message.updated",
  MESSAGE_DELETED: "message.deleted",
  READ: "read",
  MESSAGE_DELIVERED: "message.delivered",
  MEMBER_ADDED: "member.added",
  MEMBER_REMOVED: "member.removed",
  TYPING_START: "typing.start",
  TYPING_STOP: "typing.stop",
  PRESENCE_CHANGED: "presence.changed",
  REACTION_NEW: "reaction.new",
  REACTION_DELETED: "reaction.deleted",
} as const;

export type ConversationEventName =
  (typeof ConversationEventName)[keyof typeof ConversationEventName];

/** Every WebSocket frame shares this envelope; `event` says what happened. */
interface Envelope<TEvent extends ConversationEventName, TPayload> {
  /** Protocol version. */
  v: number;
  conversationId: string;
  /** When it happened (ISO timestamp). */
  at: string;
  /** The message sequence the event relates to, when there is one. */
  sequence?: number;
  event: TEvent;
  payload: TPayload;
}

type E = typeof ConversationEventName;

/** Every event the conversation WebSocket sends, discriminated by `event`. */
export type ConversationEvent =
  | Envelope<
      E["MESSAGE_CREATED"] | E["MESSAGE_UPDATED"] | E["MESSAGE_DELETED"],
      { message: Message }
    >
  | Envelope<
      E["READ"] | E["MESSAGE_DELIVERED"],
      { userId: string; sequence: number }
    >
  | Envelope<E["MEMBER_ADDED"], { member: Member }>
  | Envelope<E["MEMBER_REMOVED"], { userId: string; actorId: string | null }>
  | Envelope<E["TYPING_START"] | E["TYPING_STOP"], { userId: string }>
  | Envelope<E["PRESENCE_CHANGED"], { userId: string; online: boolean }>
  | Envelope<
      E["REACTION_NEW"] | E["REACTION_DELETED"],
      { reaction: Reaction; counts: Record<string, number> }
    >;

export interface ConnectOptions {
  token: string;
  conversationId: string;
  baseUrl?: string;
  /** Replay everything after this sequence, so a client that reconnects
   *  doesn't miss messages sent while it was away. */
  since?: number;
  onEvent: (event: ConversationEvent) => void;
}

/**
 * Open the conversation's WebSocket with the browser's (or React Native's)
 * built-in WebSocket; no client library needed. The session token rides the
 * `Sec-WebSocket-Protocol` header as `bearer, <token>`, the standard way to
 * send a token from a browser, which can't set other headers on a socket.
 *
 * Returns the socket: call `close()` when you're done with it.
 */
export function connectConversation(options: ConnectOptions): WebSocket {
  const url = new URL(
    `/v1/conversations/${options.conversationId}/ws`,
    options.baseUrl ?? DEFAULT_BASE_URL
  );
  url.protocol = url.protocol === "http:" ? "ws:" : "wss:";
  if (options.since !== undefined) {
    url.searchParams.set("since", String(options.since));
  }

  const socket = new WebSocket(url, ["bearer", options.token]);
  socket.onmessage = (frame) => {
    options.onEvent(JSON.parse(String(frame.data)) as ConversationEvent);
  };
  return socket;
}
