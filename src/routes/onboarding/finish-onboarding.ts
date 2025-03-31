import type { JiraProfile } from "../../api/get-me.query.js";
import type { Configuration } from "../../env.js";
import { CONFIG_LOCATION } from "../../lib/constants.js";
import { makeLogger } from "../../lib/log.js";

export type OnboardingData = {
  jiraUrl: URL;
  apiToken: string;
  boardId: string;
  profile: JiraProfile;
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
    // TODO: Story points and board jql
    STORY_POINTS_FIELD: "",
    DEVELOPER_FIELD: "",
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
