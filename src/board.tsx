import { Box, Text, useInput } from "ink";
import React, { useCallback, useState } from "react";
import type { z } from "zod";
import type { issue } from "./api/issue-query.js";
import { Column } from "./column.js";
import { useStdoutDimensions } from "./useStdoutDimensions.js";

const groupIssuesByColumn = (issues: z.infer<typeof issue>[]) => {
  return Object.groupBy(issues, (issue) => {
    const statusName = issue.fields.status.name.toLowerCase();

    if (statusName === "ready for sprint") {
      return "to do";
    }

    if (statusName === "ready to merge") {
      return "merge to epic";
    }

    if (statusName === "released") {
      return "done";
    }

    return statusName.toLowerCase();
  });
};

const getColumn = (
  groupedIssues: Partial<Record<string, z.infer<typeof issue>[]>>,
  columnName: string,
) => {
  return groupedIssues[columnName.toLowerCase()] ?? [];
};

export const Board = ({
  columns,
  issues,
  filteredUsers,
  ignoreInput = false,
}: {
  columns: string[];
  issues: z.infer<typeof issue>[];
  filteredUsers: string[];
  ignoreInput: boolean;
}) => {
  const [width, height] = useStdoutDimensions();
  const [top, setTop] = useState(0);
  const [left, setLeft] = useState(0);
  const [selectedIssue, setSelectedIssue] = useState<{
    columnIndex: number;
    issueIndex: number;
  }>({ columnIndex: 0, issueIndex: 0 });

  const filteredIssues = issues.filter((issue) =>
    filteredUsers.includes(issue.fields.assignee.displayName),
  );

  const groupedIssues = groupIssuesByColumn(filteredIssues);
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

  const checkAndSetTop = useCallback(
    (newIndex: number) => {
      if (newIndex * 7 - top + 10 > height - 7) {
        setTop((prev) => prev + 7);
      }

      if (newIndex * 7 - top - 10 < 0) {
        setTop((prev) => Math.max(prev - 7, 0));
      }
    },
    [top, height],
  );

  const checkAndSetLeft = useCallback(
    (newIndex: number) => {
      if (newIndex * 36 - left + 36 > width) {
        setLeft((prev) => prev + 36);
      }

      if (newIndex * 36 - left - 36 < 0) {
        setLeft((prev) => Math.max(prev - 36, 0));
      }
    },
    [left, width],
  );

  useInput((input, key) => {
    if (ignoreInput) return;

    if (input === "j" || key.downArrow) {
      setSelectedIssue((prev) => {
        const newIndex = Math.min(
          getColumn(groupedIssues, columns[prev.columnIndex]!).length - 1,
          prev.issueIndex + 1,
        );

        checkAndSetTop(newIndex);

        return {
          ...prev,
          issueIndex: newIndex,
        };
      });
    } else if (input === "k" || key.upArrow) {
      setSelectedIssue((prev) => {
        const newIndex = Math.max(0, prev.issueIndex - 1);

        checkAndSetTop(newIndex);

        return {
          ...prev,
          issueIndex: newIndex,
        };
      });
    } else if (input === "h" || key.leftArrow) {
      setSelectedIssue((prev) => {
        const newIndex = Math.max(0, prev.columnIndex - 1);
        const newIssueIndex = Math.min(
          Math.max(getColumn(groupedIssues, columns[newIndex]!).length - 1, 0),
          prev.issueIndex,
        );

        checkAndSetLeft(newIndex);

        if (newIssueIndex * 7 < top) {
          setTop(Math.max(newIssueIndex * 7 - 15, 0));
        }

        return {
          columnIndex: newIndex,
          issueIndex: newIssueIndex,
        };
      });
    } else if (input === "l" || key.rightArrow) {
      setSelectedIssue((prev) => {
        const newIndex = Math.min(columns.length - 1, prev.columnIndex + 1);

        const newIssueIndex = Math.min(
          Math.max(getColumn(groupedIssues, columns[newIndex]!).length - 1, 0),
          prev.issueIndex,
        );

        checkAndSetLeft(newIndex);

        if (newIssueIndex * 7 < top) {
          setTop(Math.max(newIssueIndex * 7 - 15, 0));
        }

        return {
          columnIndex: newIndex,
          issueIndex: newIssueIndex,
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
        <Box gap={1} width={"100%"} marginLeft={-left}>
          {columns?.map((name, index) => {
            const distanceFromStart = (index + 1) * 36 - left;
            return (
              <Column
                name={name}
                key={name}
                issues={getColumn(groupedIssues, name)}
                top={top}
                hideIssues={distanceFromStart > width}
                distanceOffScreen={distanceFromStart - width}
                shouldGrow={allColumnsVisible}
                selectedIndex={
                  index === selectedIssue.columnIndex
                    ? selectedIssue.issueIndex
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
            totalHeight === 0 ? 0 : ((height / totalHeight) * top) / 2 - 3
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
          (width / 2 / maxColumnOffset) * (left / 36),
          width / 2 - 2,
        )}
      />
    </Box>
  );
};
