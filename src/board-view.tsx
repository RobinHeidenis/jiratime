import { Spinner } from "@inkjs/ui";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { Box, Text, useInput } from "ink";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useBoardQuery } from "./api/get-board.query.js";
import { useIssueQuery } from "./api/get-issues.query.js";
import { useTransitionIssueMutation } from "./api/transition-issue.mutation.js";
import { useUpdateIssueMutation } from "./api/update-issue.mutation.js";
import {
  closeModal,
  inputDisabledAtom,
  modalsAtom,
} from "./atoms/modals.atom.js";
import { Board } from "./board.js";
import { SelectLaneModal } from "./modals/select-lane-modal.js";
import { SelectPriorityModal } from "./modals/select-priority-modal.js";
import { SelectUsersModal } from "./modals/select-users-modal.js";
import { UpdateAssigneeModal } from "./modals/update-assignee.modal.js";
import { ViewIssueModal } from "./modals/view-issue-modal.js";

export const BoardView = () => {
  const { mutate: updateIssue } = useUpdateIssueMutation();
  const { mutate: transitionIssue } = useTransitionIssueMutation();

  const { data: board } = useBoardQuery();
  const { data: issues } = useIssueQuery(board?.filter.jql);

  const isFetching = useIsFetching();
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<string[]>([]);
  const [selectUsersModalOpen, setSelectUsersModalOpen] = useState(false);
  const modals = useAtomValue(modalsAtom);
  const inputDisabled = useAtomValue(inputDisabledAtom);

  const queryClient = useQueryClient();

  useInput((input, key) => {
    if (selectUsersModalOpen || inputDisabled) return;

    if (input === "u") {
      setSelectUsersModalOpen(true);
    }

    // Note: this also captures R when caps lock is enabled
    if (input === "R" && key.shift) {
      queryClient.invalidateQueries();
    }
  });

  const allUsers = [
    ...new Set(
      issues?.map((issue) => issue.fields.assignee.displayName),
    ).values(),
  ].filter((user) => user && user !== "Unassigned") as string[];

  const viewIssue = issues?.find((issue) => issue.id === selectedIssue);

  return (
    <>
      {board && issues ? (
        <Board
          boardConfiguration={board}
          issues={issues}
          filteredUsers={filteredUsers.length ? filteredUsers : allUsers}
          ignoreInput={!!(selectUsersModalOpen || selectedIssue)}
          viewIssue={(id) => setSelectedIssue(id)}
        />
      ) : (
        <Spinner label="Getting data from Jira" />
      )}
      {board && issues && (
        <Box width={"100%"} justifyContent="space-between">
          <Text>{" Filter users: u | Open: o"}</Text>
          {isFetching > 0 && <Spinner label="Fetching" />}
          <Text>{" Refresh: R "}</Text>
        </Box>
      )}

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
      {modals.updateAssignee && <UpdateAssigneeModal />}
      {modals.updatePriority && viewIssue && (
        <SelectPriorityModal
          onClose={() => closeModal("updatePriority")}
          onSelect={(priority) =>
            updateIssue({
              issueId: viewIssue.id,
              fields: {
                priority: { id: priority.value, name: priority.label },
              },
            })
          }
        />
      )}
      {modals.moveIssue && (
        <SelectLaneModal onClose={() => closeModal("moveIssue")} />
      )}
    </>
  );
};
