import clipboard from "clipboardy";
import { formatBranchName } from "../lib/utils/format-branch-name.js";
import { showNotification } from "../notifications/show.js";

export const copyBranchName = (
  issueKey: string,
  issueType: string,
  summary: string,
) => {
  const formattedBranchName = formatBranchName(summary, issueKey, issueType);
  clipboard.writeSync(formattedBranchName);

  showNotification({
    type: "info",
    message: `${issueKey} - Copied branch name`,
  });
};
