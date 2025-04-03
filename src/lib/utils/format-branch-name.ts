import { kebabCase } from "es-toolkit";
import { env } from "../../env.js";

export const formatBranchName = (
  summary: string,
  issueKey: string,
  issueType: string,
) => {
  const formattedSummary = kebabCase(summary);
  return (
    env.branchFormat
      ?.replace("$issueKey", issueKey)
      .replace("$issueSummary", formattedSummary)
      .replace("$issueType", issueType?.toLowerCase()) ??
    `${issueKey}-${formattedSummary}`
  );
};
