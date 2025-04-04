import clipboard from "clipboardy";
import type { Issue } from "../api/get-issues.query.js";
import { showNotification } from "../notifications/show.js";

export const copyIssueKey = (issue: Pick<Issue, "key">) => {
  clipboard.writeSync(issue.key);

  showNotification({
    type: "info",
    message: `Copied ${issue.key}`,
  });
};
