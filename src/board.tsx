import { Box, Text, useInput } from "ink";
import { useAtom, useAtomValue } from "jotai/react";
import { useCallback } from "react";
import type { z } from "zod";
import type { boardWithFilter } from "./api/get-board.query.js";
import type { Issue } from "./api/get-issues.query.js";
import { highlightedIssueAtom } from "./atoms/highlighted-issue.atom.js";
import { inputDisabledAtom, openModal } from "./atoms/modals.atom.js";
import { scrollOffsetAtom } from "./atoms/scroll-offset.atom.js";
import { Column } from "./column.js";
import { openIssueInBrowser } from "./lib/utils/openIssueInBrowser.js";
import { useStdoutDimensions } from "./useStdoutDimensions.js";

export const groupIssuesByColumn = (
  issues: Issue[],
  columnConfig: { name: string; statuses: { id: string }[] }[],
) => {
  const statusMap = columnConfig.reduce(
    (acc, column) => {
      for (const status of column.statuses) {
        acc[status.id] = column.name;
      }

      return acc;
    },
    {} as Record<string, string>,
  );
  const columns: Record<string, Issue[]> = {};

  for (const column of columnConfig) {
    columns[column.name.toLowerCase()] = [];
  }

  for (const issue of issues) {
    const columnName = statusMap[issue.fields.status.id];

    if (!columnName) {
      continue;
    }

    const column = columns[columnName.toLowerCase()];

    if (column) {
      column.push(issue);
    }
  }

  return columns;
};

const getColumn = (
  groupedIssues: Partial<Record<string, Issue[]>>,
  columnName: string,
) => {
  return groupedIssues[columnName.toLowerCase()] ?? [];
};

const getSelectedIssue = (
  groupedIssues: Partial<Record<string, Issue[]>>,
  columns: string[],
  highlightedIssue: { column: number; index: number },
) => {
  return getColumn(groupedIssues, columns[highlightedIssue.column]!)[
    highlightedIssue.index
  ];
};

export const Board = ({
  boardConfiguration,
  issues,
  filteredUsers,
  ignoreInput = false,
  viewIssue,
}: {
  boardConfiguration: z.infer<typeof boardWithFilter>;
  issues: Issue[];
  filteredUsers: string[];
  ignoreInput: boolean;
  viewIssue: (id: string | null) => void;
}) => {
  const [width, height] = useStdoutDimensions();
  const [scrollOffset, setScrollOffset] = useAtom(scrollOffsetAtom);
  const [highlightedIssue, setHighlightedIssue] = useAtom(highlightedIssueAtom);
  const inputDisabled = useAtomValue(inputDisabledAtom);

  const columns = boardConfiguration.columnConfig.columns.map((c) => c.name);

  const filteredIssues = issues.filter((issue) =>
    filteredUsers.includes(issue.fields.assignee.displayName),
  );

  const groupedIssues = groupIssuesByColumn(
    filteredIssues,
    boardConfiguration.columnConfig.columns,
  );
  const maxIssueCount = groupedIssues
    ? Math.max(
        ...Object.values(groupedIssues).map((issues) =>
          issues ? issues.length : 0,
        ),
      )
    : 0;
  const totalHeight = Math.max(maxIssueCount * 7 - height, 0);
  const maxColumnOffset = Math.floor((columns.length ?? 0) - width / 36 + 1);
  const allColumnsVisible = (columns.length ?? 0) <= width / 36;

  const checkAndSetOffsets = useCallback(
    (dimension: "top" | "left", offset: number) => {
      const { top, left } = scrollOffset;

      if (dimension === "top") {
        if (offset * 7 - top + 10 > height - 7) {
          setScrollOffset((prev) => ({ ...prev, top: prev.top + 7 }));
        }

        if (offset * 7 - top - 10 < 0) {
          setScrollOffset((prev) => ({
            ...prev,
            top: Math.max(prev.top - 7, 0),
          }));
        }
      } else {
        if (offset * 36 - left + 36 > width) {
          setScrollOffset((prev) => ({ ...prev, left: prev.left + 36 }));
        }

        if (offset * 36 - left - 36 < 0) {
          setScrollOffset((prev) => ({
            ...prev,
            left: Math.max(prev.left - 36, 0),
          }));
        }
      }
    },
    [scrollOffset, height, width, setScrollOffset],
  );

  useInput((input, key) => {
    if (inputDisabled) return;

    if (input === "p") {
      openModal("updatePriority");
      return;
    }
    if (input === "a") {
      openModal("updateAssignee");
      return;
    }
    if (input === "m") {
      openModal("moveIssue");
      return;
    }

    if (ignoreInput) return;

    if (key.return) {
      const issue = getSelectedIssue(groupedIssues, columns, highlightedIssue);

      viewIssue(issue?.id ?? null);
    } else if (input === "o") {
      const issue = getColumn(groupedIssues, columns[highlightedIssue.column]!)[
        highlightedIssue.index
      ];

      openIssueInBrowser(issue?.key ?? "");
    } else if (input === "j" || key.downArrow) {
      setHighlightedIssue((prev) => {
        const column = getColumn(groupedIssues, columns[prev.column]!);
        const newIndex = Math.min(column.length - 1, prev.index + 1);

        checkAndSetOffsets("top", newIndex);

        return {
          ...prev,
          id: column[newIndex]?.id ?? null,
          index: newIndex,
        };
      });
    } else if (input === "k" || key.upArrow) {
      setHighlightedIssue((prev) => {
        const newIndex = Math.max(0, prev.index - 1);

        const column = getColumn(groupedIssues, columns[prev.column]!);

        checkAndSetOffsets("top", newIndex);

        return {
          ...prev,
          id: column[newIndex]?.id ?? null,
          index: newIndex,
        };
      });
    } else if (input === "h" || key.leftArrow) {
      setHighlightedIssue((prev) => {
        const newIndex = Math.max(0, prev.column - 1);
        const column = getColumn(groupedIssues, columns[newIndex]!);
        const newIssueIndex = Math.min(
          Math.max(column.length - 1, 0),
          prev.index,
        );

        checkAndSetOffsets("left", newIndex);

        if (newIssueIndex * 7 < scrollOffset.top) {
          setScrollOffset((prev) => ({
            top: Math.max(newIssueIndex * 7 - 15, 0),
            left: prev.left,
          }));
        }

        return {
          id: column[newIssueIndex]?.id ?? null,
          column: newIndex,
          index: newIssueIndex,
        };
      });
    } else if (input === "l" || key.rightArrow) {
      setHighlightedIssue((prev) => {
        const newIndex = Math.min(columns.length - 1, prev.column + 1);

        const column = getColumn(groupedIssues, columns[newIndex]!);
        const newIssueIndex = Math.min(
          Math.max(column.length - 1, 0),
          prev.index,
        );

        checkAndSetOffsets("left", newIndex);

        if (newIssueIndex * 7 < scrollOffset.top) {
          setScrollOffset((prev) => ({
            left: prev.left,
            top: Math.max(newIssueIndex * 7 - 15, 0),
          }));
        }

        return {
          id: column[newIssueIndex]?.id ?? null,
          column: newIndex,
          index: newIssueIndex,
        };
      });
    }
  });

  return (
    <Box flexDirection="column" width={width - 2}>
      <Text>
        {" "}
        Selected users:{" "}
        {filteredUsers.map((user) => user.split(" ")[0]).join(", ")}
      </Text>
      <Box width={"100%"} overflow="hidden">
        <Box gap={1} width={"100%"} marginLeft={-scrollOffset.left}>
          {columns?.map((name, index) => {
            const distanceFromStart = (index + 1) * 36 - scrollOffset.left;
            return (
              <Column
                name={name}
                key={name}
                issues={getColumn(groupedIssues, name)}
                top={scrollOffset.top}
                hideIssues={distanceFromStart > width}
                distanceOffScreen={distanceFromStart - width}
                shouldGrow={allColumnsVisible}
                selectedIndex={
                  index === highlightedIssue.column
                    ? highlightedIssue.index
                    : undefined
                }
              />
            );
          })}
        </Box>
        <Box
          position="absolute"
          height={"50%"}
          borderLeft={false}
          borderBottom={false}
          borderTop={false}
          borderColor={"greenBright"}
          borderStyle={"bold"}
          marginLeft={width - 3}
          marginTop={
            totalHeight === 0
              ? 0
              : ((height / totalHeight) * scrollOffset.top) / 2 - 3
          }
        />
      </Box>
      <Box
        width={allColumnsVisible ? "100%" : "50%"}
        borderStyle={"bold"}
        borderBottom={false}
        borderColor={"greenBright"}
        borderRight={false}
        borderLeft={false}
        marginLeft={Math.min(
          (width / 2 / maxColumnOffset) * (scrollOffset.left / 36),
          width / 2 - 2,
        )}
      />
    </Box>
  );
};
