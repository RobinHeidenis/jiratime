import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { z } from "zod";

const CONFIG_LOCATION = path.join(homedir(), ".config", "jira-tui.json");

let configFileConfig: object | undefined;
try {
  const configFile = readFileSync(CONFIG_LOCATION, "utf-8");
  configFileConfig = JSON.parse(configFile);
} catch {
  console.error("❌ Missing or invalid config file");
}

const envVariables = z.object({
  JIRA_API_KEY: z.string(),
  JIRA_BASE_URL: z.string().url(),
  JIRA_BOARD_ID: z.string().or(z.number()),
  STORY_POINTS_FIELD: z.string(),
});

const mergedConfig = { ...configFileConfig, ...process.env };
const result = envVariables.safeParse(mergedConfig);

if (!result.success) {
  console.error("❌ Missing or invalid environment variables:");
  for (const [key, value] of Object.entries(
    result.error.flatten().fieldErrors,
  )) {
    console.error(`  - ${key}: ${value}`);
  }
  console.error(
    "\nPlease pass these variables by exporting them through your shell or creating a .env file",
  );
  process.exit(1);
}

const env = result.data;

export { env };
