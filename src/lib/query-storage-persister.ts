import { existsSync, mkdirSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { makeLogger } from "./logger.js";
import { throttleWithTrailing } from "./utils/throttle-with-trailing.js";

const CACHE_LOCATION = path.join(
  homedir(),
  ".cache",
  "jira-tui",
  "query-client.json",
);

// Ensure the cache directory exists
const cacheDir = path.dirname(CACHE_LOCATION);
if (!existsSync(cacheDir)) {
  mkdirSync(cacheDir, { recursive: true });
}

const logger = makeLogger("QueryStoragePersister");

// Throttle the persisting of the client to avoid spamming the disk
const THROTTLING_TIME = 5000;

export function createFilePersister() {
  return {
    persistClient: throttleWithTrailing(async (client: PersistedClient) => {
      try {
        logger.log("Persisting client");
        await writeFile(CACHE_LOCATION, JSON.stringify(client));
      } catch (error) {
        logger.log(
          `Could not persist client: ${error instanceof Error ? error.message : error}`,
        );
      }
    }, THROTTLING_TIME),
    restoreClient: async () => {
      logger.log("Restoring client");
      try {
        return JSON.parse(await readFile(CACHE_LOCATION, "utf-8"));
      } catch (error) {
        logger.log(
          `Could not restore client: ${error instanceof Error ? error.message : error}`,
        );
      }
    },
    removeClient: async () => {
      try {
        await unlink(CACHE_LOCATION);
      } catch (error) {
        logger.log(
          `Could not remove client: ${error instanceof Error ? error.message : error}`,
        );
      }
    },
  } satisfies Persister;
}
