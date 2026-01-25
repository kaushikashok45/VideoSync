import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import * as fs from "node:fs";
import ReactCompilerConfig from "./react-compiler.config.json";

const isDev = process.env.NODE_ENV === "development";

declare module "react-router" {
  // or cloudflare, deno, etc.
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    reactRouter({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', ReactCompilerConfig],
        ],
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
