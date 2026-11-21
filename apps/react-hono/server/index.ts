import { serveStatic } from "@hono/bun";
import { Hono } from "hono";
import { app } from "./app";

/**
 * Production entry: `bun run build`, then `bun run start`. Serves the API
 * routes and the built React app from one Bun process. (In development,
 * `bun run dev` runs the same Hono app inside Vite instead.)
 *
 * Bun loads `.env` and `.env.local` itself, so the API key is read from there.
 */
const server = new Hono()
  .route("/", app)
  .use("/*", serveStatic({ root: "./dist" }))
  // Client-side routes (/chat, /feed, …) all load the same page.
  .get("*", serveStatic({ path: "./dist/index.html" }));

export default {
  port: Number(process.env.PORT ?? 8787),
  fetch: server.fetch,
};
