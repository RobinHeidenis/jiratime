import { withFullScreen } from "fullscreen-ink";
import { App } from "./app.js";
import { APP_NAME, LOG_FILE } from "./lib/constants.js";
import { logger } from "./lib/logger.js";

// Clear the log file and ensure it exists
await Bun.write(LOG_FILE, "");

const ink = withFullScreen(<App />);
ink.start();
await ink.waitUntilExit();
logger.info(`${APP_NAME} is over`);
process.exit(0); // Not sure why it doen't quit on it's own, but we'll help it out
