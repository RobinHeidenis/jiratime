import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import type { Issue } from "../api/get-issues.query.js";
import { viewedIssueAtom } from "../atoms/viewed-issue.atom.js";

export const useViewedIssue = () => {
  const queryClient = useQueryClient();
  const issues = queryClient.getQueryData(["issues"]) as readonly Issue[];

  const viewedIssueId = useAtomValue(viewedIssueAtom);

  const issue = issues?.find(
    (issue) => issue.id === viewedIssueId || issue.key === viewedIssueId,
  );

  return issue ?? null;
};
