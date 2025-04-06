import { useQueryClient } from "@tanstack/react-query";
import { Box, Text } from "ink";
import { useAtomValue } from "jotai";
import open from "open";
import { useMemo, useState } from "react";
import { useGetIssueMergeRequestsQuery } from "../api/get-issue-merge-requests.query.js";
import type { Issue } from "../api/get-issues.query.js";
import { highlightedIssueAtom } from "../atoms/highlighted-issue.atom.js";
import { env } from "../env.js";
import { useKeybind } from "../hooks/use-keybind.js";
import {
  CLOSE_KEY,
  CONFIRM_KEY,
  DOWN_KEY,
  UP_KEY,
} from "../lib/keybinds/keys.js";
import { PaddedText } from "../padded-text.js";
import { useStdoutDimensions } from "../useStdoutDimensions.js";

type BaseOption = { label: string; value: string };
type JiraOption = { type: "jira" } & BaseOption;
type MergeRequestOption = {
  type: "mergeRequest";
  status: string;
  allApproved: boolean;
} & BaseOption;

type Option = JiraOption | MergeRequestOption;

export const SelectLinkedResourcesModal = ({
  onClose,
  issueId: issueIdOverride,
}: {
  onClose: () => void;
  issueId?: string | null;
}) => {
  const issueId = issueIdOverride ?? useAtomValue(highlightedIssueAtom).id;
  const queryClient = useQueryClient();
  const issues = queryClient.getQueryData(["issues"]) as Issue[];
  const issue = issues.find((issue) => issue.id === issueId)!;
  const [focused, setFocused] = useState(0);

  const { data: mergeRequests, isLoading } = useGetIssueMergeRequestsQuery(
    issue?.id!,
    !!issue,
  );

  const options: Option[] = useMemo(
    () => [
      {
        type: "jira",
        label: "Open issue in Jira",
        value: `${env.JIRA_BASE_URL}/browse/${issue.key}`,
      } satisfies JiraOption,
      ...(mergeRequests?.map((mergeRequest) => {
        const allApproved = !!(
          mergeRequest.reviewers?.length &&
          mergeRequest.reviewers?.every((reviewer) => reviewer.approved)
        );
        const status =
          mergeRequest.status !== "OPEN"
            ? ` (${mergeRequest.status.toLowerCase()})`
            : allApproved
              ? " (approved)"
              : undefined;

        return {
          type: "mergeRequest",
          status: mergeRequest.status,
          label: `[${mergeRequest.repositoryName}] ${mergeRequest.name}${status ?? ""}`,
          value: mergeRequest.url,
          allApproved,
        } satisfies MergeRequestOption;
      }) ?? []),
    ],
    [issue, mergeRequests],
  );

  const focusedOption = options[focused];

  const openMergeRequestOptions = options.filter(
    (option) =>
      option.type === "mergeRequest" &&
      option.status === "OPEN" &&
      !option.allApproved,
  );

  const [columns, rows] = useStdoutDimensions();

  // border + padding + arrow + space
  // |   > Option 1  |
  // |   Option 2    |
  const standardWidth = 1 + 5 + 1 + 1;

  const maxLength = Math.max(
    ...options.map((option) => option.label.length + standardWidth),
    26 + standardWidth,
  );

  const view = "SelectLinkedResourcesModal";

  useKeybind(
    {
      ...UP_KEY,
      name: "Up",
      hidden: true,
    },
    () => {
      setFocused((prev) => Math.max(0, prev - 1));
    },
    { view },
    [],
  );

  useKeybind(
    {
      ...DOWN_KEY,
      name: "Down",
      hidden: true,
    },
    () => {
      setFocused((prev) => Math.min(options.length - 1, prev + 1));
    },
    { view },
    [options],
  );

  useKeybind(
    {
      ...CONFIRM_KEY,
      name: "Confirm",
    },
    () => {
      open(focusedOption!.value);
      onClose();
    },
    { view },
    [focusedOption, onClose],
  );

  useKeybind(
    {
      key: "a",
      name: "Open all reviewable MRs",
    },
    () => {
      for (const option of openMergeRequestOptions) {
        open(option.value);
      }
    },
    { view },
    [openMergeRequestOptions],
  );

  useKeybind(
    {
      ...CLOSE_KEY,
      name: "Close",
    },
    onClose,
    { view },
    [],
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
        text={`   ${focused === 0 ? "> " : " "}${options[0]?.label}`}
        textProps={focused === 0 ? { color: "blue" } : { color: undefined }}
      />
      <PaddedText maxLength={maxLength} text="" />
      <PaddedText maxLength={maxLength} text="   Merge requests:" />
      {isLoading ? (
        <PaddedText maxLength={maxLength} text="    Loading..." />
      ) : mergeRequests?.length ? (
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
      ) : (
        <PaddedText maxLength={maxLength} text="    No merge requests" />
      )}
      <Text>{"".padEnd(maxLength, " ")}</Text>
    </Box>
  );
};
