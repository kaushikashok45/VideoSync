import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import * as fs from "node:fs";

const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
  server: isDev
    ? {
        https: {
          key: fs.readFileSync("./localhost.key"),
          cert: fs.readFileSync("./localhost.pem"),
        },
      }
    : undefined,

  resolve: {
    alias: {
      "simple-peer": "simple-peer/simplepeer.min.js",
    },
  },
});
