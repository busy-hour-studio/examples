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
import { createServerClient, createUserClient } from "@examples/api";

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
const { conversation } = await me.createConversation({ name: "General" });
await me.sendMessage(conversation.id, { body: "Halo 👋" });
```

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
- `src/user.ts`: session-token calls (conversations, messages, feed, comments,
  reactions, notifications)
- `src/realtime.ts`: the conversation WebSocket and its event types
- `src/types.ts`: the JSON shapes

Full API reference: <https://docs.busyhour.id>
