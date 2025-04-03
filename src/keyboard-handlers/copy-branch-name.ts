import clipboard from "clipboardy";
import { formatBranchName } from "../lib/utils/format-branch-name.js";

export const copyBranchName = (
  issueKey: string,
  issueType: string,
  summary: string,
) => {
  const formattedBranchName = formatBranchName(summary, issueKey, issueType);
  clipboard.writeSync(formattedBranchName);
};
