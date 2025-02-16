import { Box, Text, useInput } from "ink";
import React, { useState } from "react";
import { useBoardQuery } from "./api/board-query.js";
import { useIssueQuery } from "./api/issue-query.js";
import { Board } from "./board.js";
import { SelectUsersModal } from "./select-users-modal.js";
import { ViewIssueModal } from "./view-issue-modal.js";

export const BoardView = () => {
  const { data: columnData } = useBoardQuery();
  const { data: issues } = useIssueQuery(true);
  const [selectUsersModalOpen, setSelectUsersModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<string[]>([]);

  useInput((input) => {
    if (selectUsersModalOpen) return;

    if (input === "u") {
      setSelectUsersModalOpen(true);
    }
  });

  const allUsers = [
    ...new Set(
      issues?.map((issue) => issue.fields.assignee.displayName),
    ).values(),
  ].filter(Boolean) as string[];

  const viewIssue = issues?.find((issue) => issue.id === selectedIssue);

  return (
    <>
      {columnData && issues ? (
        <Board
          columns={columnData}
          issues={issues}
          filteredUsers={filteredUsers.length ? filteredUsers : allUsers}
          ignoreInput={!!(selectUsersModalOpen || selectedIssue)}
          viewIssue={(id) => setSelectedIssue(id)}
        />
      ) : (
        <Text>Loading...</Text>
      )}
      <Box width={"100%"}>
        <Text> Filter users: u</Text>
      </Box>

      {selectUsersModalOpen && (
        <SelectUsersModal
          title={"Select users to show issues from:"}
          footer={"Select: <space> | Confirm: <return> | Cancel: q"}
          selected={filteredUsers.length ? filteredUsers : allUsers}
          options={allUsers}
          onSelect={(selectedUsers) => setFilteredUsers(selectedUsers)}
          onClose={() => setSelectUsersModalOpen(false)}
        />
      )}
      {selectedIssue && viewIssue && (
        <ViewIssueModal
          onClose={() => setSelectedIssue(null)}
          issue={viewIssue}
        />
      )}
    </>
  );
};
