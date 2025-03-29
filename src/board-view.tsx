import { Spinner } from "@inkjs/ui";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { Box, Text } from "ink";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useMemo, useState } from "react";
import { useBoardQuery } from "./api/get-board.query.js";
import { useIssueQuery } from "./api/get-issues.query.js";
import { useUpdateIssueMutation } from "./api/update-issue.mutation.js";
import {
  boardSearchAtom,
  boardSearchStateAtom,
  resetBoardSearchAtom,
} from "./atoms/board-search.atom.js";
import { keybindsDisplayAtom } from "./atoms/keybinds.atom.js";
import {
  closeModal,
  inputDisabledAtom,
  modalsAtom,
} from "./atoms/modals.atom.js";
import { Board } from "./board.js";
import { SearchInput } from "./components/search.js";
import { env } from "./env.js";
import { useKeybinds } from "./hooks/use-keybinds.js";
import { SelectLaneModal } from "./modals/select-lane-modal.js";
import { SelectPriorityModal } from "./modals/select-priority-modal.js";
import { SelectUsersModal } from "./modals/select-users-modal.js";
import { UpdateAssigneeModal } from "./modals/update-assignee.modal.js";
import { ViewIssueModal } from "./modals/view-issue-modal.js";
import type { JiraUser } from "./types/jira-user.js";

const myAccountId = env.JIRA_ACCOUNT_ID;

export const BoardView = () => {
  const { mutate: updateIssue } = useUpdateIssueMutation();

  const { data: board } = useBoardQuery();
  const { data: issues } = useIssueQuery(board?.filter.jql);

  const isFetching = useIsFetching();
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<JiraUser[]>([]);
  const [selectUsersModalOpen, setSelectUsersModalOpen] = useState(false);
  const modals = useAtomValue(modalsAtom);
  const inputDisabled = useAtomValue(inputDisabledAtom);
  const [boardSearch, setBoardSearch] = useAtom(boardSearchAtom);
  const resetBoardSearch = useSetAtom(resetBoardSearchAtom);

  const searchState = useAtomValue(boardSearchStateAtom);

  const queryClient = useQueryClient();

  const keybindsDisplay = useAtomValue(keybindsDisplayAtom);

  const usersById: Map<string, JiraUser> = useMemo(() => {
    if (!issues) {
      return new Map();
    }

    return new Map(
      issues
        .filter((issue) => issue.fields.assignee.displayName !== "Unassigned")
        .map((issue) => [
          issue.fields.assignee.accountId,
          issue.fields.assignee,
        ]),
    );
  }, [issues]);

  const me = myAccountId ? usersById.get(myAccountId) : undefined;

  const viewIssue = issues?.find((issue) => issue.id === selectedIssue);

  const allUsers = Array.from(usersById.values());

  const filteredIssuesBySearch = useMemo(() => {
    if (!issues?.length || !boardSearch) {
      return issues ?? [];
    }

    const needle = boardSearch.toLowerCase();
    return issues.filter(
      (issue) =>
        issue.key.toLowerCase().includes(needle) ||
        issue.fields.summary.toLowerCase().includes(needle),
    );
  }, [issues, boardSearch]);

  useKeybinds(
    "BoardView",
    (register) => {
      register({
        key: "/",
        name: "Search",
        handler: () => {
          if (searchState === "disabled") {
            resetBoardSearch();
          }
        },
      });

      register({
        key: "u",
        name: "Filter users",
        handler: () => setSelectUsersModalOpen(true),
      });

      if (me) {
        register({
          key: "M",
          modifiers: ["shift"],
          name: "Assigned to me",
          handler: () =>
            setFilteredUsers((current) => {
              if (current.length === 1 && current[0] === me) {
                return [];
              }

              return [me];
            }),
        });
      }

      register({
        key: "o",
        name: "Open",
        handler: () => setSelectedIssue(issues?.[0]?.id ?? null),
      });

      register({
        key: "m",
        name: "Move issue",
        handler: () => {
          if (selectedIssue) {
            closeModal("moveIssue");
          }
        },
      });

      register({
        key: "a",
        name: "Change assignee",
        handler: () => {
          if (selectedIssue) {
            closeModal("updateAssignee");
          }
        },
      });

      register({
        key: "R",
        modifiers: ["shift"],
        name: "Refresh",
        handler: () => queryClient.invalidateQueries(),
      });
    },
    [me],
  );

  return (
    <>
      {board && issues ? (
        <Board
          boardConfiguration={board}
          issues={filteredIssuesBySearch}
          filteredUsers={filteredUsers.length ? filteredUsers : allUsers}
          ignoreInput={!!(selectUsersModalOpen || selectedIssue)}
          viewIssue={(id) => setSelectedIssue(id)}
          preselectFirstIssue={searchState === "result"}
        />
      ) : (
        <Spinner label="Getting data from Jira" />
      )}
      {board &&
        issues &&
        (searchState === "disabled" ? (
          <Box width={"100%"} justifyContent="space-between">
            <Text>{` ${keybindsDisplay}`}</Text>
            {isFetching > 0 && <Spinner label="Fetching" />}
          </Box>
        ) : (
          <Box>
            <Text> </Text>
            <SearchInput
              state={searchState === "active" ? "search" : "result"}
              value={boardSearch ?? ""}
              onChange={setBoardSearch}
              onStopSearching={resetBoardSearch}
              onResetSearch={resetBoardSearch}
            />
          </Box>
        ))}

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
