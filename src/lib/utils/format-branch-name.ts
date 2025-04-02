import { env } from "../../env.js";
import { hyphenatedSummary } from "./hyphenated-summary.js";

export const formatBranchName = (
  summary: string,
  issueKey: string,
  issueType: string,
) => {
  const formattedSummary = hyphenatedSummary(summary);
  return (
    env.BRANCH_FORMAT?.replace("$issueKey", issueKey)
      .replace("$issueSummary", formattedSummary)
      .replace("$issueType", issueType?.toLowerCase()) ??
    `${issueKey}-${formattedSummary}`
  );
};
