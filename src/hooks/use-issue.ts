import { useQueryClient } from "@tanstack/react-query";
import type { Issue } from "../api/get-issues.query.js";

export const useIssue = (issueId: string | null) => {
  const queryClient = useQueryClient();
  const issues = queryClient.getQueryData(["issues"]) as Issue[];

  const issue = issues?.find((issue) => issue.id === issueId)!;

  return issue ?? null;
};
