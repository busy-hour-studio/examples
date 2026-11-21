import type { NextConfig } from "next";

const config: NextConfig = {
  // The shared API package is TypeScript source in this workspace, not a
  // published build, so Next compiles it along with the app.
  transpilePackages: ["@examples/api"],
};

export default config;
