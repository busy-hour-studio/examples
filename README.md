# BusyHour examples

Runnable examples for [BusyHour](https://busyhour.id): in-app chat, activity
feeds and notifications over plain REST + WebSockets, with no SDK.

| Example                                 | What it shows                                                                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [`packages/api`](./packages/api)        | The API calls the apps share: typed `fetch` wrappers and the WebSocket helper. Not an SDK; copy what you need.                                  |
| [Next.js full-stack app](./apps/nextjs) | Route handlers mint session tokens and send notifications with the API key; the browser does chat, the feed and the inbox with the user's token |
| React (Vite) + Hono on Bun              | Coming soon                                                                                                                                     |
| Expo mobile app                         | Coming soon                                                                                                                                     |

Each app covers the basics: **chat**, an **activity feed** and a
**notification inbox**.

## Getting started

You need [Bun](https://bun.sh) and a BusyHour project. Sign up at
<https://console.busyhour.id>, create a project, and create an API key.

```sh
git clone https://github.com/busy-hour-studio/examples.git
cd examples
bun install
```

Then follow the README of the example you want to run.

## Repo checks

```sh
bun run lint          # ESLint (type-aware)
bun run typecheck     # every package and app
bun run build
bun run format:check  # Prettier
```

`bun install` sets up the git hooks: staged files are linted and formatted on
commit, and commit messages follow
[Conventional Commits](https://www.conventionalcommits.org) (`feat: …`,
`fix: …`), checked by commitlint.

API docs: <https://docs.busyhour.id>

Licensed under [MIT](./LICENSE). Copy anything you like into your own app.
