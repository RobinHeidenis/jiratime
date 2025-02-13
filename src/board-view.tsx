import { Box, Text, useInput } from "ink";
import React, { useState } from "react";
import { useBoardQuery } from "./api/board-query.js";
import { useIssueQuery } from "./api/issue-query.js";
import { Column } from "./column.js";
import { SelectModal } from "./select-modal.js";
import { useStdoutDimensions } from "./useStdoutDimensions.js";

export const BoardView = () => {
  const { data: columnData } = useBoardQuery();
  const { data: issues } = useIssueQuery(true);
  const [width, height] = useStdoutDimensions();
  const [top, setTop] = useState(0);
  const [left, setLeft] = useState(0);
  const [selectUsersModalOpen, setSelectUsersModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<{
    columnIndex: number;
    issueIndex: number;
  }>({ columnIndex: 0, issueIndex: 0 });
  const [filteredUsers, setFilteredUsers] = useState<string[] | null>(null);

  const filteredIssues = issues
    ? Object.fromEntries(
        Object.entries(issues).map(([key, value]) => [
          key,
          value?.filter((issue) =>
            !filteredUsers || !filteredUsers.length
              ? true
              : filteredUsers.includes(issue.fields.assignee.displayName),
          ),
        ]),
      )
    : null;

  const maxIssueCount = issues
    ? Math.max(
        ...Object.values(issues).map((issues) => (issues ? issues.length : 0)),
      )
    : 0;
  const totalHeight = Math.max(maxIssueCount * 7 - height, 0);
  const maxColumnOffset = Math.floor(
    (columnData?.length ?? 0) - width / 36 + 1,
  );
  const allColumnsVisible = (columnData?.length ?? 0) <= width / 36;

  useInput((input, key) => {
    if (selectUsersModalOpen) return;

    if (input === "j" || key.downArrow) {
      setSelectedIssue((prev) => {
        const newIndex = Math.min(
          (
            filteredIssues?.[
              columnData![prev.columnIndex]!.name.toLowerCase()
            ] ?? []
          ).length - 1,
          prev.issueIndex + 1,
        );

        if (newIndex * 7 - top + 10 > height - 7) {
          setTop((prev) => prev + 7);
        }

        if (newIndex * 7 - top - 10 < 0) {
          setTop((prev) => Math.max(prev - 7, 0));
        }

        return {
          ...prev,
          issueIndex: newIndex,
        };
      });
    } else if (input === "k" || key.upArrow) {
      setSelectedIssue((prev) => {
        const newIndex = Math.max(0, prev.issueIndex - 1);

        if (newIndex * 7 - top + 10 > height - 7) {
          setTop((prev) => prev + 7);
        }

        if (newIndex * 7 - top - 10 < 0) {
          setTop((prev) => Math.max(prev - 7, 0));
        }

        return {
          ...prev,
          issueIndex: newIndex,
        };
      });
    } else if (input === "h" || key.leftArrow) {
      setSelectedIssue((prev) => {
        const newIndex = Math.max(0, prev.columnIndex - 1);
        const newIssueIndex = Math.min(
          Math.max(
            (filteredIssues?.[columnData![newIndex]!.name.toLowerCase()] ?? [])
              .length - 1,
            0,
          ),
          prev.issueIndex,
        );

        if (newIndex * 36 - left + 36 > width) {
          setLeft((prev) => prev + 36);
        }

        if (newIndex * 36 - left - 36 < 0) {
          setLeft((prev) => Math.max(prev - 36, 0));
        }

        if (newIssueIndex * 7 < top) {
          setTop(Math.max(newIssueIndex * 7 - 15, 0));
        }

        return {
          ...prev,
          columnIndex: newIndex,
          issueIndex: newIssueIndex,
        };
      });
    } else if (input === "l" || key.rightArrow) {
      setSelectedIssue((prev) => {
        const newIndex = Math.min(
          (columnData?.length ?? 0) - 1,
          prev.columnIndex + 1,
        );

        const newIssueIndex = Math.min(
          Math.max(
            (filteredIssues?.[columnData![newIndex]!.name.toLowerCase()] ?? [])
              .length - 1,
            0,
          ),
          prev.issueIndex,
        );

        if (newIndex * 36 - left + 36 > width) {
          setLeft((prev) => prev + 36);
        }

        if (newIndex * 36 - left - 36 < 0) {
          setLeft((prev) => Math.max(prev - 36, 0));
        }

        if (newIssueIndex * 7 < top) {
          setTop(Math.max(newIssueIndex * 7 - 15, 0));
        }

        return {
          ...prev,
          columnIndex: newIndex,
          issueIndex: newIssueIndex,
        };
      });
    } else if (input === "u") {
      setSelectUsersModalOpen(true);
    }
  });

  const columns = columnData?.map((column) => column.name);

  if (!columns || !issues) {
    return (
      <Box width={width - 2}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  const allUsers = [
    ...new Set(
      Object.values(issues ?? {}).flatMap((issues) =>
        issues?.map((issue) => issue.fields.assignee.displayName),
      ),
    ).values(),
  ].filter(Boolean) as string[];

  return (
    <>
      <Box flexDirection="column" width={width - 2}>
        <Text>
          {" "}
          Selected users:{" "}
          {(!filteredUsers || !filteredUsers.length ? allUsers : filteredUsers)
            .map((user) => user.split(" ")[0])
            .join(", ")}
        </Text>
        <Box width={"100%"} overflow="hidden">
          <Box gap={1} width={"100%"} marginLeft={-left}>
            {columns?.map((name, index) => (
              <Column
                name={name}
                key={name}
                issues={filteredIssues?.[name.toLowerCase()] ?? []}
                top={top}
                hideIssues={(index + 1) * 36 - left > width}
                shouldGrow={allColumnsVisible}
                selectedIndex={
                  index === selectedIssue.columnIndex
                    ? selectedIssue.issueIndex
                    : undefined
                }
              />
            ))}
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
      <Box width={"100%"}>
        <Text> Filter users: u</Text>
      </Box>

      {selectUsersModalOpen && (
        <SelectModal
          title={"Select users to show issues from:"}
          footer={"Select: <space> | Confirm: <return> | Cancel: q"}
          options={allUsers}
          onSelect={(selectedUsers) => setFilteredUsers(selectedUsers)}
          onClose={() => setSelectUsersModalOpen(false)}
        />
      )}
    </>
  );
};
