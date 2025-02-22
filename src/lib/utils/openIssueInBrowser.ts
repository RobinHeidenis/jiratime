import open from "open";
import { env } from "../../env.js";

export const openIssueInBrowser = (issueKey: string) => {
  open(`${env.JIRA_BASE_URL}/browse/${issueKey}`);
};
