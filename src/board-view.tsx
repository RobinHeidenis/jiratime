import { Box, Text, useInput } from "ink";
import React, { useState } from "react";
import { useBoardQuery } from "./api/board-query.js";
import { useIssueQuery } from "./api/issue-query.js";
import { Board } from "./board.js";
import { SelectModal } from "./select-modal.js";

export const BoardView = () => {
  const { data: columnData } = useBoardQuery();
  const { data: issues } = useIssueQuery(true);
  const [selectUsersModalOpen, setSelectUsersModalOpen] = useState(false);
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

  return (
    <>
      {columnData && issues ? (
        <Board
          columns={columnData}
          issues={issues}
          filteredUsers={filteredUsers.length ? filteredUsers : allUsers}
          ignoreInput={selectUsersModalOpen}
        />
      ) : (
        <Text>Loading...</Text>
      )}
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
