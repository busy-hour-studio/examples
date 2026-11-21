# BusyHour × Next.js

A full-stack Next.js (App Router) app with the three BusyHour basics:

- **Chat**: start a DM with anyone by name, message history, live messages
  over the conversation's WebSocket, and unread counts.
- **Feed**: post, like, comment, follow people, and an **All / Following**
  view.
- **Notifications**: an inbox with an unread badge. Following someone or
  commenting on their post notifies them.

No SDK: it's `fetch` and the browser's own `WebSocket`, through the copyable
helpers in [`packages/api`](../../packages/api).

## Run it

1. In the [BusyHour console](https://console.busyhour.id), create a project
   and an **API key** with the scopes `sessions:write`, `users:write` and
   `notifications:write`. In the project settings, turn on **Activities** and
   **Notifications**.
2. From the repo root:

   ```sh
   bun install
   cp apps/nextjs/.env.example apps/nextjs/.env.local
   # fill in BUSYHOUR_API_KEY and BUSYHOUR_PROJECT_ID
   cd apps/nextjs && bun run dev
   ```

3. Open <http://localhost:3000> and sign in with a name. Open a second
   browser (or a private window), sign in as someone else, and DM yourself.

## How it fits together

```
Browser ──(session token)──────────────────────► BusyHour API
   │                                                 ▲
   └─► Next.js route handlers ──(API key)────────────┘
        /api/session   mint a session token  (POST /v1/sessions)
        /api/users     find a user by name   (POST /v1/projects/:id/users)
        /api/notify    send a notification   (POST /v1/notifications)
```

- **The API key stays on the server.** Only the route handlers use it, via
  [`src/lib/server.ts`](./src/lib/server.ts). That file imports `server-only`,
  so importing it into client code fails the build.
- **The browser calls BusyHour directly** with the user's short-lived session
  token, for chat, the feed and the inbox. The token only grants what that
  user may do.
- **Author names come with the data.** Activities, comments, messages and
  members embed the author's profile (`user`, or `sender` on messages), so the
  UI renders names straight from the response, with no extra lookup.
- **Routes that act for a user verify them first:** `/api/users` and
  `/api/notify` read the caller's session token and check it with
  `GET /v1/users/me` before using the API key.

## Where to look

| File                                                                           | What it shows                                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| [`src/app/api/session/route.ts`](./src/app/api/session/route.ts)               | Minting a session token (your login would call this)                      |
| [`src/app/api/notify/route.ts`](./src/app/api/notify/route.ts)                 | Sending a notification from your backend                                  |
| [`src/components/session-provider.tsx`](./src/components/session-provider.tsx) | Keeping the token in the browser and building the user client             |
| [`src/app/chat/page.tsx`](./src/app/chat/page.tsx)                             | History, then live events with `connectConversation` and `?since=` replay |
| [`src/app/feed/page.tsx`](./src/app/feed/page.tsx)                             | The following feed, reactions, comments, follows                          |
| [`src/app/inbox/page.tsx`](./src/app/inbox/page.tsx)                           | The inbox, mark read, dismiss                                             |

## Not production-ready on purpose

- **Sign-in is just a name.** In a real app, `/api/session` sits behind your
  own authentication and uses your user id as `externalId`.
- **The session lives in `localStorage`** for simplicity. Tokens expire;
  this app signs you out when yours does. A real app would refresh it.

Full API reference: <https://docs.busyhour.id>
