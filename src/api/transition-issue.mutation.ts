import { useMutation, useQueryClient } from "@tanstack/react-query";
import { highlightedIssueAtom } from "../atoms/highlighted-issue.atom.js";
import { scrollOffsetAtom } from "../atoms/scroll-offset.atom.js";
import { store } from "../atoms/store.js";
import { groupIssuesByColumn } from "../board.js";
import { log } from "../lib/log.js";
import type { FetchBoardResult } from "./get-board.query.js";
import type { Issue } from "./get-issues.query.js";
import { request } from "./request.js";

interface TransitionIssueMutationVariables {
  issueId: string;
  transitionId: string;
  newStatusId: string;
}

const transitionIssue = async (variables: TransitionIssueMutationVariables) => {
  await request(`api/3/issue/${variables.issueId}/transitions`, {
    method: "POST",
    body: JSON.stringify({
      transition: {
        id: variables.transitionId,
      },
    }),
  });
};

export const useTransitionIssueMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    TransitionIssueMutationVariables,
    { previousIssues: Issue[] }
  >({
    mutationFn: transitionIssue,
    onMutate: async (variables) => {
      queryClient.cancelQueries({ queryKey: ["issues"] });

      const issues = queryClient.getQueryData(["issues"]) as Issue[];

      const newIssues = issues.map((issue) => {
        if (issue.id === variables.issueId) {
          return {
            ...issue,
            fields: {
              ...issue.fields,
              status: {
                id: variables.newStatusId,
              },
            },
          };
        }

        return issue;
      });

      queryClient.setQueryData(["issues"], newIssues);

      const board = queryClient.getQueryData<Awaited<FetchBoardResult>>([
        "board",
      ]);

      if (!board) {
        log("No board found in query cache, not changing highlighted issue");
      } else {
        const grouped = groupIssuesByColumn(
          newIssues,
          board.columnConfig.columns,
        );

        Object.entries(grouped).forEach(([_key, issues], columnIndex) => {
          const issueIndex = issues.findIndex(
            (issue) => issue.id === variables.issueId,
          );
          if (issueIndex >= 0) {
            store.set(highlightedIssueAtom, {
              id: issues[issueIndex]?.id ?? null,
              column: columnIndex,
              index: issueIndex,
            });

            store.set(scrollOffsetAtom, (prev) => {
              const issueHeight = 7;
              const issueWidth = 36;
              const screenColumns = 5;

              // Calculate new potential top and left positions
              const newTop = issueIndex * issueHeight;
              const newLeft = columnIndex * issueWidth;

              // Check if the issue is already visible on the screen
              const isVerticallyVisible =
                newTop >= prev.top &&
                newTop < prev.top + screenColumns * issueHeight;

              const isHorizontallyVisible =
                newLeft >= prev.left &&
                newLeft < prev.left + screenColumns * issueWidth;

              // Only update if the issue is not currently visible
              if (!isVerticallyVisible || !isHorizontallyVisible) {
                return {
                  top: newTop,
                  left:
                    newLeft > screenColumns * issueWidth
                      ? newLeft - screenColumns * issueWidth
                      : 0,
                };
              }

              // If issue is already on screen, return previous state
              return prev;
            });
          }
        });
      }

      return { previousIssues: issues };
    },
    onError: (error, _variables, context) => {
      log(`Error updating issue: ${error.message} ${error.stack}`);
      queryClient.setQueryData(["issues"], context?.previousIssues ?? []);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
};
