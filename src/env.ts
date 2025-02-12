import { z } from "zod";

const envVariables = z.object({
  JIRA_API_KEY: z.string(),
  JIRA_BASE_URL: z.string().url(),
  JIRA_BOARD_ID: z.string(),
  STORY_POINTS_FIELD: z.string(),
});

const result = envVariables.safeParse(process.env);

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
