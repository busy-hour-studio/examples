# BusyHour × React + Hono

A React single-page app (Vite) with a small [Hono](https://hono.dev) backend
on Bun, and the three BusyHour basics:

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
   cp apps/react-hono/.env.example apps/react-hono/.env.local
   # fill in BUSYHOUR_API_KEY and BUSYHOUR_PROJECT_ID
   cd apps/react-hono && bun run dev
   ```

3. Open <http://localhost:5173> and sign in with a name. Open a second
   browser (or a private window), sign in as someone else, and DM yourself.

`bun run dev` is one process: Vite serves the React app and runs the Hono app
for `/api/*` (via `@hono/vite-dev-server`). For production, `bun run build`
then `bun run start` serves both from Bun on port 8787.

## How it fits together

```
Browser ──(session token)──────────────────────► BusyHour API
   │                                                 ▲
   └─► Hono backend ──(API key)──────────────────────┘
        POST /api/session   mint a session token  (POST /v1/sessions)
        POST /api/users     find a user by name   (POST /v1/projects/:id/users)
        POST /api/notify    send a notification   (POST /v1/notifications)
```

- **The API key stays on the server.** Only [`server/`](./server) reads it.
  The React app imports nothing from there but a type.
- **The browser calls its backend with Hono's typed client.**
  [`src/lib/backend.ts`](./src/lib/backend.ts) builds `hc<AppType>`, so the
  paths, request bodies and responses are checked against the routes in
  [`server/app.ts`](./server/app.ts).
- **The browser calls BusyHour directly** with the user's short-lived session
  token, for chat, the feed and the inbox. The token only grants what that
  user may do.
- **Author names come with the data.** Activities, comments, messages and
  members embed the author's profile (`user`, or `sender` on messages), so the
  UI renders names straight from the response, with no extra lookup.
- **Routes that act for a user verify them first.** The `requireCaller`
  middleware checks the caller's session token with `GET /v1/users/me` before
  `/api/users` and `/api/notify` use the API key.

## Where to look

| File                                                                           | What it shows                                                               |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| [`server/app.ts`](./server/app.ts)                                             | The three routes: minting a session, finding a user, sending a notification |
| [`server/busyhour.ts`](./server/busyhour.ts)                                   | The API-key client, the `requireCaller` middleware, body validators         |
| [`src/components/session-provider.tsx`](./src/components/session-provider.tsx) | Keeping the token in the browser and building the user client               |
| [`src/pages/chat.tsx`](./src/pages/chat.tsx)                                   | History, then live events with `connectConversation` and `?since=` replay   |
| [`src/pages/feed.tsx`](./src/pages/feed.tsx)                                   | The following feed, reactions, comments, follows                            |
| [`src/pages/inbox.tsx`](./src/pages/inbox.tsx)                                 | The inbox, mark read, dismiss                                               |

## Not production-ready on purpose

- **Sign-in is just a name.** In a real app, `/api/session` sits behind your
  own authentication and uses your user id as `externalId`.
- **The session lives in `localStorage`** for simplicity. Tokens expire;
  this app signs you out when yours does. A real app would refresh it.
- **Routing is a few lines over the History API**
  ([`src/lib/router.tsx`](./src/lib/router.tsx)) to keep the example small.
  Swap in your router of choice.

Full API reference: <https://docs.busyhour.id>
