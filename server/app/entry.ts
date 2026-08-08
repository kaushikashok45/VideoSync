import { loadConfig } from "./config.ts";
import { createLogger } from "../shared/logger/logger.ts";
import { startServer } from "./server.ts";

const config = loadConfig();
const logger = createLogger({
  level: config.nodeEnv === "production" ? "info" : "debug",
});
await startServer(config, logger);
