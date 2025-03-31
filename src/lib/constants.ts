import { homedir } from "node:os";
import path from "node:path";

export const APP_NAME = "JiraTime";

export const CONFIG_LOCATION = path.join(homedir(), ".config", "jira-tui.json");
