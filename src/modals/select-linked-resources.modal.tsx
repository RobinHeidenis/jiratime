import { useQueryClient } from "@tanstack/react-query";
import { Box, Text } from "ink";
import { atom, useAtomValue } from "jotai";
import open from "open";
import { useMemo } from "react";
import { useGetIssueMergeRequestsQuery } from "../api/get-issue-merge-requests.query.js";
import type { Issue } from "../api/get-issues.query.js";
import { highlightedIssueAtom } from "../atoms/highlighted-issue.atom.js";
import { store } from "../atoms/store.js";
import { env } from "../env.js";
import { useKeybinds } from "../hooks/use-keybinds.js";
import {
  CLOSE_KEY,
  CONFIRM_KEY,
  DOWN_KEY,
  UP_KEY,
} from "../lib/keybinds/keys.js";
import { PaddedText } from "../padded-text.js";
import { useStdoutDimensions } from "../useStdoutDimensions.js";

const focusedAtom = atom(0);

export const SelectLinkedResourcesModal = ({
  onClose,
  issueId: issueIdOverride,
}: {
  onClose: () => void;
  issueId?: string | null;
}) => {
  const focused = useAtomValue(focusedAtom);
  const [columns, rows] = useStdoutDimensions();
  const issueId = issueIdOverride ?? useAtomValue(highlightedIssueAtom).id;
  const queryClient = useQueryClient();
  const issues = queryClient.getQueryData(["issues"]) as Issue[];

  const issue = issues.find((issue) => issue.id === issueId)!;

  const { data: mergeRequests, isLoading } = useGetIssueMergeRequestsQuery(
    issue?.id!,
    !!issue,
  );

  const options = useMemo(
    () => [
      {
        label: "Open issue in Jira",
        value: `${env.JIRA_BASE_URL}/browse/${issue.key}`,
      },
      ...(mergeRequests?.map((mergeRequest) => ({
        label: `[${mergeRequest.repositoryName}] ${mergeRequest.name}${mergeRequest.status !== "OPEN" ? ` (${mergeRequest.status.toLowerCase()})` : ""}`,
        value: mergeRequest.url,
      })) ?? []),
    ],
    [issue.key, mergeRequests],
  );

  // border + padding + arrow + space
  // |   > Option 1  |
  // |   Option 2    |
  const standardWidth = 1 + 5 + 1 + 1;

  const maxLength = Math.max(
    ...options.map((option) => option.label.length + standardWidth),
    26 + standardWidth,
  );

  useKeybinds(
    { view: "SelectLinkedResourcesModal", unregister: true },
    (register) => {
      register({
        ...UP_KEY,
        name: "Up",
        hidden: true,
        handler: () => {
          store.set(focusedAtom, (prev) => Math.max(0, prev - 1));
        },
      });

      register({
        ...DOWN_KEY,
        name: "Down",
        hidden: true,
        handler: () => {
          store.set(focusedAtom, (prev) =>
            Math.min((mergeRequests?.length ?? 1) - 1, prev + 1),
          );
        },
      });

      register({
        ...CONFIRM_KEY,
        name: "Confirm",
        handler: () => {
          const focused = store.get(focusedAtom);

          open(options[focused]!.value);
          onClose();
        },
      });

      register({
        ...CLOSE_KEY,
        name: "Close",
        handler: onClose,
      });
    },
    [options, mergeRequests],
  );

  return (
    <Box
      flexDirection="column"
      position="absolute"
      borderStyle={"round"}
      borderColor={"green"}
      marginLeft={Math.floor((columns - (maxLength + 2)) / 2)}
      marginTop={Math.floor((rows - (1 + options.length + 2)) / 2)}
    >
      <Text>
        {"   "}
        {"What do you want to open?".padEnd(maxLength - 3, " ")}
      </Text>
      <PaddedText
        maxLength={maxLength}
        text={`   ${focused === 0 ? "> " : " "}${options[0]!.label}`}
        textProps={focused === 0 ? { color: "blue" } : { color: undefined }}
      />
      <PaddedText maxLength={maxLength} text="" />
      <PaddedText maxLength={maxLength} text="   Merge requests:" />
      {isLoading ? (
        <PaddedText maxLength={maxLength} text="Loading..." />
      ) : (
        options.slice(1).map((option, index) => {
          const text =
            `   ${index + 1 === focused ? "> " : " "}${option.label}`.padEnd(
              maxLength,
              " ",
            );

          return (
            <Text
              key={option.value}
              color={index + 1 === focused ? "blue" : undefined}
            >
              {text}
            </Text>
          );
        })
      )}
      <Text>{"".padEnd(maxLength, " ")}</Text>
    </Box>
  );
};
