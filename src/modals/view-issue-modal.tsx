import { useQueryClient } from "@tanstack/react-query";
import { Box, Text } from "ink";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { prefetchIssueMergeRequests } from "../api/get-issue-merge-requests.query.js";
import { prefetchIssueTransitions } from "../api/get-issue-transitions.query.js";
import { prefetchPriorities } from "../api/get-priorities.query.js";
import { prefetchUsers } from "../api/get-users.query.js";
import type { ModalKey } from "../atoms/modals.atom.js";
import { viewedIssueAtom } from "../atoms/viewed-issue.atom.js";
import { env } from "../env.js";
import { useKeybind } from "../hooks/use-keybind.js";
import { useViewedIssue } from "../hooks/use-viewed-issue.js";
import { priorityMap } from "../issue.js";
import { copyBranchName } from "../keyboard-handlers/copy-branch-name.js";
import { copyIssueKey } from "../keyboard-handlers/copy-issue-key.js";
import { ADFRenderer } from "../lib/adf/adf-renderer.js";
import type { TopLevelNode } from "../lib/adf/nodes.js";
import { CommonKey } from "../lib/keybinds/keys.js";
import { PaddedText } from "../padded-text.js";
import { useStdoutDimensions } from "../useStdoutDimensions.js";

const MINIMUM_LINES = 33;
const VIEWPORT_HEIGHT = 35;
const MAX_LINE_WIDTH = 119;

const SMALL_SCROLL_INCREMENT = 3;
const LARGE_SCROLL_INCREMENT = 10;

export const ViewIssueModal = ({
  openModal,
}: {
  openModal: (type: ModalKey, issueId: string) => void;
}) => {
  const issue = useViewedIssue();
  const queryClient = useQueryClient();

  const [columns, rows] = useStdoutDimensions();
  const [topOffset, setTopOffset] = useState(0);
  const setViewedIssue = useSetAtom(viewedIssueAtom);

  const description = issue
    ? new ADFRenderer(MAX_LINE_WIDTH, MINIMUM_LINES).render(
        issue.fields.description?.content?.length
          ? (issue.fields.description.content as TopLevelNode[])
          : [
              {
                type: "paragraph",
                content: [{ type: "text", text: "No description." }],
              },
            ],
      )
    : [];

  const view = "ViewIssueModal";

  useKeybind(
    "m",
    {
      view,
      name: "Move issue",
    },
    () => {
      openModal("moveIssue", issue!.id);
    },
    [issue, openModal],
  );

  useKeybind(
    "a",
    {
      view,
      name: "Update assignee",
    },
    () => {
      openModal("updateAssignee", issue!.id);
    },
    [issue, openModal],
  );

  useKeybind(
    "p",
    {
      view,
      name: "Update priority",
    },
    () => {
      openModal("updatePriority", issue!.id);
    },
    [issue, openModal],
  );

  useKeybind(
    ["j", "downArrow"], // Don't use CommonKey.Down, excluding ctrl+n here
    {
      view,
      name: "Scroll down",
      hidden: true,
    },
    () => {
      if (description.length > VIEWPORT_HEIGHT) {
        setTopOffset((prev) =>
          Math.min(
            prev + SMALL_SCROLL_INCREMENT,
            description.length - MINIMUM_LINES,
          ),
        );
      }
    },
    [description],
  );

  useKeybind(
    ["k", "upArrow"], // Don't use CommonKey.Up, excluding ctrl+p here
    {
      view,
      name: "Scroll up",
      hidden: true,
    },
    () => {
      if (description.length > VIEWPORT_HEIGHT) {
        setTopOffset((prev) => Math.max(prev - SMALL_SCROLL_INCREMENT, 0));
      }
    },
    [description],
  );

  useKeybind(
    "ctrl + d",
    {
      view,
      name: "Scroll down (fast)",
      hidden: true,
    },
    () => {
      if (description.length > VIEWPORT_HEIGHT) {
        setTopOffset((prev) =>
          Math.min(
            prev + LARGE_SCROLL_INCREMENT,
            description.length - MINIMUM_LINES,
          ),
        );
      }
    },
    [description],
  );

  useKeybind(
    "ctrl + u",
    {
      view,
      name: "Scroll up (fast)",
      hidden: true,
    },
    () => {
      if (description.length > VIEWPORT_HEIGHT) {
        setTopOffset((prev) => Math.max(prev - LARGE_SCROLL_INCREMENT, 0));
      }
    },
    [description],
  );

  useKeybind(
    "o",
    {
      view,
      name: "Linked resources",
    },
    () => {
      openModal("linkedResources", issue!.id);
    },
    [openModal, issue],
  );

  useKeybind(
    "y",
    {
      view,
      name: "Copy ticket number",
    },
    () => {
      copyIssueKey(issue!);
    },
    [issue],
  );

  useKeybind(
    "shift + y",
    {
      view,
      name: "Copy branch name",
    },
    () => {
      if (!issue) {
        return;
      }

      copyBranchName(
        issue.key,
        issue.fields.issuetype.name,
        issue.fields.summary,
      );
    },
    [issue],
  );

  useKeybind(
    CommonKey.Close,
    {
      view,
      name: "Close",
    },
    () => {
      setViewedIssue(null);
    },
    [setViewedIssue],
  );

  if (!issue) {
    return null;
  }

  prefetchUsers(queryClient, issue.id);
  prefetchPriorities(queryClient, issue.fields.project.id);
  prefetchIssueTransitions(queryClient, issue.id);
  prefetchIssueMergeRequests(queryClient, issue.id);

  const paddedText = description.map((line) => `${line} `).join("\n");

  // title/description + outer borders + assignees + assignee borders
  const width = 122 + 2 + 20 + 2;

  return (
    <Box
      flexDirection="column"
      position="absolute"
      borderStyle={"round"}
      borderColor={"greenBright"}
      marginLeft={(columns - width) / 2}
      marginTop={(rows - 50) / 2}
    >
      <Box flexDirection="row">
        <Box flexDirection="column">
          <Box
            borderStyle={"round"}
            borderColor={"green"}
            width={122}
            height={3}
          >
            <Text>{issue.fields.summary.padEnd(120, " ")}</Text>
          </Box>
          <Box
            borderStyle={"round"}
            borderColor={"green"}
            width={122}
            height={VIEWPORT_HEIGHT}
            overflowY="hidden"
          >
            <Box flexDirection="column" marginTop={-topOffset}>
              <Text>{paddedText}</Text>
            </Box>
          </Box>
        </Box>
        <Box
          borderStyle={"round"}
          borderColor={"green"}
          width={22}
          height={38}
          flexDirection="column"
        >
          <PaddedText text={`\uf292  ${issue.key}`} />
          <PaddedText
            text={`\uf43a  ${issue.fields.storyPoints !== null ? issue.fields.storyPoints : "N/A"}`}
          />
          <PaddedText
            text={`\uf161  ${issue.fields.priority.name}`}
            textProps={{
              color: priorityMap[issue.fields.priority.name] ?? "yellow",
            }}
          />
          <PaddedText text={`\uf007  ${issue.fields.assignee.displayName}`} />
          {env.DEVELOPER_FIELD && (
            <PaddedText
              text={`\uf121  ${issue.fields.developer?.displayName}`}
            />
          )}
          <PaddedText text={`\uf50a  ${issue.fields.reporter.displayName}`} />
          {Array.from({
            length: 40 + (env.DEVELOPER_FIELD ? 0 : 1) - 10,
          }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: We're not actually showing any content, just spaces to override the underlying content
            <PaddedText key={i} text={""} />
          ))}
        </Box>
      </Box>
      {description.length > VIEWPORT_HEIGHT && (
        <Box
          position="absolute"
          borderStyle={"bold"}
          borderColor={"greenBright"}
          width={1}
          marginLeft={width - 26}
          borderTop={false}
          borderRight={false}
          borderBottom={false}
          marginTop={
            4 + (topOffset * 16) / (description.length - MINIMUM_LINES)
          }
          height={17}
        />
      )}
    </Box>
  );
};
