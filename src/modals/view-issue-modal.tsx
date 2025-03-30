import { useQueryClient } from "@tanstack/react-query";
import { Box, Text } from "ink";
import { atom, useStore } from "jotai";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { prefetchIssueTransitions } from "../api/get-issue-transitions.query.js";
import type { Issue } from "../api/get-issues.query.js";
import { prefetchPriorities } from "../api/get-priorities.query.js";
import { prefetchUsers } from "../api/get-users.query.js";
import type { ModalKey } from "../atoms/modals.atom.js";
import { viewedIssueAtom } from "../atoms/viewed-issue.atom.js";
import { env } from "../env.js";
import { useKeybinds } from "../hooks/use-keybinds.js";
import { useViewedIssue } from "../hooks/use-viewed-issue.js";
import { priorityMap } from "../issue.js";
import { ADFRenderer } from "../lib/adf/adf-renderer.js";
import type { TopLevelNode } from "../lib/adf/nodes.js";
import { CLOSE_KEY, DOWN_KEY, UP_KEY } from "../lib/keybinds/keys.js";
import { openIssueInBrowser } from "../lib/utils/openIssueInBrowser.js";
import { PaddedText } from "../padded-text.js";
import { useStdoutDimensions } from "../useStdoutDimensions.js";

const issueAtom = atom<Issue | null>(null);
const topOffsetAtom = atom(0);

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
  const topOffset = useAtomValue(topOffsetAtom);
  const store = useStore();

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

  useEffect(() => {
    store.set(issueAtom, issue);
    store.set(topOffsetAtom, 0); // Reset scroll offset when issue changes

    return () => {
      store.set(issueAtom, null);
    };
  }, [store, issue]);

  useKeybinds(
    { view: "ViewIssueModal", unregister: true },
    (register) => {
      register({
        key: "m",
        name: "Move issue",
        handler: () => {
          openModal("moveIssue", store.get(issueAtom)!.id);
        },
      });

      register({
        key: "a",
        name: "Update assignee",
        handler: () => {
          openModal("updateAssignee", store.get(issueAtom)!.id);
        },
      });

      register({
        key: "p",
        name: "Update priority",
        handler: () => {
          openModal("updatePriority", store.get(issueAtom)!.id);
        },
      });

      register({
        ...DOWN_KEY,
        aliases: [
          { key: "", modifiers: ["downArrow"] },
          { key: "d", modifiers: ["ctrl"] },
        ],
        name: "Scroll down",
        hidden: true,
        when: () => description.length > VIEWPORT_HEIGHT,
        handler: () => {
          store.set(topOffsetAtom, (prev) =>
            Math.min(
              prev + SMALL_SCROLL_INCREMENT,
              description.length - MINIMUM_LINES,
            ),
          );
        },
      });

      register({
        ...UP_KEY,
        aliases: [
          { key: "", modifiers: ["upArrow"] },
          { key: "u", modifiers: ["ctrl"] },
        ],
        name: "Scroll up",
        hidden: true,
        when: () => description.length > VIEWPORT_HEIGHT,
        handler: () => {
          store.set(topOffsetAtom, (prev) =>
            Math.max(prev - SMALL_SCROLL_INCREMENT, 0),
          );
        },
      });

      register({
        key: "d",
        modifiers: ["ctrl"],
        name: "Scroll down (fast)",
        hidden: true,
        when: () => description.length > VIEWPORT_HEIGHT,
        handler: () => {
          store.set(topOffsetAtom, (prev) => {
            return Math.min(
              prev + LARGE_SCROLL_INCREMENT,
              description.length - MINIMUM_LINES,
            );
          });
        },
      });

      register({
        key: "u",
        modifiers: ["ctrl"],
        name: "Scroll up (fast)",
        hidden: true,
        when: () => description.length > VIEWPORT_HEIGHT,
        handler: () => {
          store.set(topOffsetAtom, (prev) =>
            Math.max(prev - LARGE_SCROLL_INCREMENT, 0),
          );
        },
      });

      register({
        key: "o",
        name: "Open in browser",
        handler: () => {
          const issue = store.get(issueAtom);
          if (issue) {
            openIssueInBrowser(issue.key);
          }
        },
      });

      register({
        ...CLOSE_KEY,
        name: "Close",
        handler: () => {
          store.set(viewedIssueAtom, null);
        },
      });
    },
    [],
  );

  if (!issue) {
    return null;
  }

  prefetchUsers(queryClient, issue.id);
  prefetchPriorities(queryClient, issue.fields.project.id);
  prefetchIssueTransitions(queryClient, issue.id);

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
            <PaddedText text={`\uf121  ${issue.fields.developer}`} />
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
