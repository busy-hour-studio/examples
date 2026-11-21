# `@examples/api`

The BusyHour API calls the example apps share: about 300 lines of typed
`fetch` wrappers. **This isn't an SDK and isn't published.** BusyHour is plain
REST + WebSockets, so there's nothing to install. Copy these files into your app
(or just read them) and adapt them freely.

It runs anywhere with `fetch` and `WebSocket`: Node, Bun, the browser and React
Native.

## Two clients, two credentials

|                      | Credential                 | Where it runs               | What it does                               |
| -------------------- | -------------------------- | --------------------------- | ------------------------------------------ |
| `createServerClient` | your **API key**           | your backend only           | mint session tokens, trigger notifications |
| `createUserClient`   | a user's **session token** | browser, mobile, or backend | chat, feed, inbox, as that user            |

```ts
import {
  createServerClient,
  createUserClient,
  NotificationAudience,
  ReactionTarget,
} from "@examples/api";

// Backend: mint a token for the signed-in user.
const server = createServerClient({
  apiKey: process.env.BUSYHOUR_API_KEY!,
  projectId: process.env.BUSYHOUR_PROJECT_ID!,
});
const { token, user } = await server.createSession({
  externalId: "user-123",
  displayName: "Ada",
});

// Anywhere: call the API as that user.
const me = createUserClient({ token });

// Chat
const { conversation } = await me.chat.create({ name: "General" });
await me.chat.send(conversation.id, { body: "Halo 👋" });

// Feed: post, react, and read what the people you follow posted
const post = await me.feeds.create({ verb: "post", body: "First post!" });
await me.feeds.react(ReactionTarget.ACTIVITY, post.id, "like");
const { data: following } = await me.feeds.list({ following: true });

// Notifications: the user's inbox (sent from your backend, below)
const unread = await me.notifications.unreadCount();
await me.notifications.markAllRead();

// Backend: notify users; it lands in their inbox
await server.sendNotification({
  audience: NotificationAudience.USERS,
  userIds: [user.id],
  title: "Welcome!",
});
```

The user client is grouped by feature:

| Group              | Calls                                                                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `me.users`         | `me`, `follow`, `unfollow`, `following`, `followers`, `followCounts`                                                                                                                           |
| `me.chat`          | `list`, `create`, `get`, `messages`, `send`, `markRead`                                                                                                                                        |
| `me.feeds`         | `list` (filter by authors, verbs, or `following`), `get`, `create`, `update`, `delete`, `comments`, `getComment`, `comment`, `updateComment`, `deleteComment`, `reactions`, `react`, `unreact` |
| `me.notifications` | `list`, `unreadCount`, `markRead`, `markAllRead`, `dismiss`, `registerDevice`, `removeDevice`                                                                                                  |

Realtime is the platform's own `WebSocket`:

```ts
import { connectConversation, ConversationEventName } from "@examples/api";

const socket = connectConversation({
  token,
  conversationId: conversation.id,
  onEvent: (event) => {
    if (event.event === ConversationEventName.MESSAGE_CREATED) {
      console.log(event.payload.message.body);
    }
  },
});
```

Errors come back as `BusyHourError`, with the HTTP `status` and the API's error
`code`.

## Files

- `src/http.ts`: the one `fetch` call, error handling, `newExternalId()`
- `src/server.ts`: API-key calls (`POST /v1/sessions`, `POST /v1/notifications`)
- `src/user.ts`: `createUserClient`, which groups the feature modules below
- `src/users.ts`: profile and follows
- `src/chat.ts`: conversations and messages
- `src/feeds.ts`: activities, comments and reactions
- `src/notifications.ts`: the inbox and push device tokens
- `src/realtime.ts`: the conversation WebSocket and its event types
- `src/types.ts`: the JSON shapes

Full API reference: <https://docs.busyhour.id>
