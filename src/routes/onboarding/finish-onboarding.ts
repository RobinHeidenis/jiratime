import type { JiraProfile } from "../../api/get-me.query.js";
import type { Configuration } from "../../env.js";
import { CONFIG_LOCATION } from "../../lib/constants.js";
import { makeLogger } from "../../lib/log.js";

export const CUSTOM_FIELDS = {
  storyPoints: "Story points",
  developer: "Developer",
} as const;

export type CustomFields = typeof CUSTOM_FIELDS;

export type OnboardingData = {
  jiraUrl: URL;
  apiToken: string;
  boardId: string;
  profile: JiraProfile;
  customFields: { [K in keyof CustomFields]: string | null };
};

const logger = makeLogger("FinishOnboarding");

export async function finishOnboarding(data: OnboardingData): Promise<boolean> {
  const writeResult = await writeConfig(data);
  if (writeResult === false) {
    return false;
  }

  return true;
}

async function writeConfig(data: OnboardingData): Promise<boolean> {
  const configData = {
    JIRA_API_KEY: data.apiToken,
    JIRA_BASE_URL: data.jiraUrl,
    JIRA_BOARD_ID: data.boardId,
    JIRA_ACCOUNT_ID: data.profile.accountId,
    JIRA_ACCOUNT_NAME: data.profile.displayName,
    STORY_POINTS_FIELD: data.customFields.storyPoints ?? "",
    DEVELOPER_FIELD: data.customFields.developer ?? "",
    // TODO: board jql?
    boards: {
      [data.boardId]: {
        jqlPrefix: "",
      },
    },
    onboarded: true,
  } satisfies Configuration;
  try {
    await Bun.write(CONFIG_LOCATION, JSON.stringify(configData, null, 2));
    return true;
  } catch (error) {
    logger.log(
      `Failed to write config file ${error instanceof Error ? error.message : error}`,
    );

    return false;
  }
}
