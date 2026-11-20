import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents is intentionally off: this prototype is driven entirely by
  // client state (localStorage + today's date), so prerendering adds nothing.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
