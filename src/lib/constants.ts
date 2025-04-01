import { homedir } from "node:os";
import path from "node:path";

export const APP_NAME = "JiraTime";

export const CONFIG_LOCATION = path.join(homedir(), ".config", "jira-tui.json");

export const QUERY_CACHE_LOCATION = path.join(
  homedir(),
  ".cache",
  "jiratime",
  "query-client.json",
);

// Make sure to keep this in sync with the `logs` script in package.json
export const LOG_FILE = path.join(
  homedir(),
  ".local",
  "state",
  "jiratime",
  "app.log",
);
