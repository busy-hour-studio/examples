/// <reference types="vite/client" />

// The `VITE_` variables the browser bundle reads (see `.env.example`).
interface ImportMetaEnv {
  readonly VITE_BUSYHOUR_API_URL?: string;
}
