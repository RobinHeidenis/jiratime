import { z } from "zod";
import { CONFIG_LOCATION } from "./lib/constants.js";

const configFile = await Bun.file(CONFIG_LOCATION)
  .json()
  .catch(async () => {
    const defaultConfig = { onboarded: false };
    await Bun.write(CONFIG_LOCATION, JSON.stringify(defaultConfig, null, 2));

    return defaultConfig;
  });

const envVariables = z.object({
  JIRA_API_KEY: z.string(),
  JIRA_BASE_URL: z
    .string()
    .url()
    .transform((v) => new URL(v)),
  JIRA_BOARD_ID: z.string().or(z.number()),
  JIRA_ACCOUNT_ID: z.string().optional(),
  JIRA_ACCOUNT_NAME: z.string().optional(),
  STORY_POINTS_FIELD: z.string(),
  DEVELOPER_FIELD: z.string().optional(),
  boards: z.record(z.object({ jqlPrefix: z.string() })).optional(),
  onboarded: z.boolean(),
});

export type Configuration = z.infer<typeof envVariables>;

const mergedConfig = { ...configFile, ...process.env };
const result = envVariables.safeParse(mergedConfig);

if (!result.success && configFile.onboarded) {
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

export const env = (result.data ?? {}) as Configuration;
