import { type ApiCall, newExternalId, unwrap } from "./http";
import {
  type Conversation,
  type ConversationListItem,
  HttpMethod,
  type Member,
  type Message,
  type Page,
} from "./types";
import type { PageParams } from "./users";

/** Conversations and messages, as the signed-in user. New messages arrive live
 *  over the conversation's WebSocket (`connectConversation`). */
export function chatApi(call: ApiCall) {
  return {
    /** The caller's conversations, most recent first, with unread counts. */
    list: (page: PageParams = {}) =>
      call<Page<ConversationListItem>>("/v1/conversations", {
        query: { ...page },
      }),

    /** Start a conversation. A DM is just a conversation with one other
     *  member; the caller is always a member. */
    create: (input: { name?: string; memberUserIds?: string[] }) =>
      unwrap(
        call<{ data: { conversation: Conversation; members: Member[] } }>(
          "/v1/conversations",
          { method: HttpMethod.POST, body: input }
        )
      ),

    get: (conversationId: string) =>
      unwrap(
        call<{ data: Conversation }>(`/v1/conversations/${conversationId}`)
      ),

    /** Newest messages first. To load older ones, pass the previous page's
     *  `meta.nextCursor` (a sequence number) as `before`. */
    messages: (
      conversationId: string,
      page: { limit?: number; before?: number } = {}
    ) =>
      call<Page<Message, number>>(
        `/v1/conversations/${conversationId}/messages`,
        { query: { ...page } }
      ),

    /** Send a message. Everyone connected to the conversation's WebSocket gets
     *  it as a `message.created` event. Pass your own `externalId` to make
     *  retries safe; one is generated otherwise. */
    send: (
      conversationId: string,
      input: { body: string; externalId?: string }
    ) =>
      unwrap(
        call<{ data: Message }>(
          `/v1/conversations/${conversationId}/messages`,
          {
            method: HttpMethod.POST,
            body: { ...input, externalId: input.externalId ?? newExternalId() },
          }
        )
      ),

    /** Mark everything up to `sequence` as read (clears the unread count). */
    markRead: (conversationId: string, sequence: number) =>
      call<unknown>(`/v1/conversations/${conversationId}/read`, {
        method: HttpMethod.POST,
        body: { sequence },
      }),
  };
}
