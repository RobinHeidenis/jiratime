import { existsSync, mkdirSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { QUERY_CACHE_LOCATION } from "./constants.js";
import { makeLogger } from "./logger.js";
import { throttleWithTrailing } from "./utils/throttle-with-trailing.js";

// Ensure the cache directory exists
const cacheDir = path.dirname(QUERY_CACHE_LOCATION);
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
        logger.info("Persisting client");
        await writeFile(QUERY_CACHE_LOCATION, JSON.stringify(client));
      } catch (error) {
        logger.error("Could not persist client", error);
      }
    }, THROTTLING_TIME),
    restoreClient: async () => {
      logger.debug("Restoring client");
      try {
        return JSON.parse(await readFile(QUERY_CACHE_LOCATION, "utf-8"));
      } catch (error) {
        logger.error("Could not restore client", error);
      }
    },
    removeClient: async () => {
      try {
        await unlink(QUERY_CACHE_LOCATION);
      } catch (error) {
        logger.error("Could not remove client", error);
      }
    },
  } satisfies Persister;
}
