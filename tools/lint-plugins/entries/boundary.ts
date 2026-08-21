import { createBoundaryPlugin } from "../boundary-plugin.ts";

const REPO_ROOT = new URL("../../../", import.meta.url).pathname.replace(
  /\/$/,
  "",
);

/** See `entries/structural.ts` for why this default export is unavoidable. */
export default createBoundaryPlugin(REPO_ROOT);
