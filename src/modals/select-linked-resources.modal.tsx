import { useQueryClient } from "@tanstack/react-query";
import { Box, Text } from "ink";
import { atom, useAtom, useAtomValue } from "jotai";
import open from "open";
import { useEffect } from "react";
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

type BaseOption = { label: string; value: string };
type JiraOption = { type: "jira" } & BaseOption;
type MergeRequestOption = {
  type: "mergeRequest";
  status: string;
  allApproved: boolean;
} & BaseOption;

type Option = JiraOption | MergeRequestOption;

const focusedAtom = atom(0);
const optionsAtom = atom<Option[]>([]);
const focusedOptionAtom = atom((get) => get(optionsAtom)[get(focusedAtom)]);
const openMergeRequestOptionsAtom = atom((get) =>
  get(optionsAtom).filter(
    (option) =>
      option.type === "mergeRequest" &&
      option.status === "OPEN" &&
      !option.allApproved,
  ),
);

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

  const [options, setOptions] = useAtom(optionsAtom);

  useEffect(() => {
    const options = [
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
    ];

    setOptions(options);
  }, [setOptions, issue.key, mergeRequests]);

  useEffect(() => {
    store.set(focusedAtom, 0);
  }, []);

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
            Math.min(store.get(optionsAtom).length - 1, prev + 1),
          );
        },
      });

      register({
        ...CONFIRM_KEY,
        name: "Confirm",
        handler: () => {
          const focusedOption = store.get(focusedOptionAtom);

          open(focusedOption!.value);
          onClose();
        },
      });

      register({
        key: "a",
        name: "Open all reviewable MRs",
        when: () => store.get(openMergeRequestOptionsAtom).length > 0,
        handler: () => {
          const openMergeRequestOptions = store.get(
            openMergeRequestOptionsAtom,
          );

          for (const option of openMergeRequestOptions) {
            open(option.value);
          }
        },
      });

      register({
        ...CLOSE_KEY,
        name: "Close",
        handler: onClose,
      });
    },
    [options],
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
        length={maxLength}
        text={`   ${focused === 0 ? "> " : " "}${options[0]?.label}`}
        textProps={focused === 0 ? { color: "blue" } : { color: undefined }}
      />
      <PaddedText length={maxLength} />
      <PaddedText length={maxLength} text="   Merge requests:" />
      {isLoading ? (
        <PaddedText length={maxLength} text="    Loading..." />
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
        <PaddedText length={maxLength} text="    No merge requests" />
      )}
      <Text>{"".padEnd(maxLength, " ")}</Text>
    </Box>
  );
};
