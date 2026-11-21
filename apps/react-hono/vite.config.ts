import devServer from "@hono/vite-dev-server";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // The Hono server reads its secrets from `process.env`. Vite only exposes
  // `VITE_`-prefixed variables to the browser, so load the server's own
  // `BUSYHOUR_` ones from `.env.local` for the dev server here.
  Object.assign(process.env, loadEnv(mode, process.cwd(), "BUSYHOUR_"));

  return {
    plugins: [
      react(),
      // Serve `/api/*` from the Hono app in `server/app.ts`, in the same
      // process as Vite, so `bun run dev` is all you need. Everything else
      // is the React app.
      devServer({
        entry: "server/app.ts",
        export: "app",
        exclude: [/^(?!\/api(\/|$)).*/],
      }),
    ],
  };
});
