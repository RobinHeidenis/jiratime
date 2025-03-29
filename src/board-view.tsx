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
import { highlightedIssueAtom } from "./atoms/highlighted-issue.atom.js";
import {
  type ModalKey,
  closeModal,
  modalsAtom,
  openModal,
} from "./atoms/modals.atom.js";
import { store } from "./atoms/store.js";
import { viewedIssueAtom } from "./atoms/viewed-issue.atom.js";
import { Board } from "./board.js";
import { SearchInput } from "./components/search.js";
import { env } from "./env.js";
import { useKeybinds } from "./hooks/use-keybinds.js";
import { CONFIRM_KEY } from "./lib/keybinds/keys.js";
import { openIssueInBrowser } from "./lib/utils/openIssueInBrowser.js";
import { SelectLaneModal } from "./modals/select-lane-modal.js";
import { SelectPriorityModal } from "./modals/select-priority-modal.js";
import { SelectUsersModal } from "./modals/select-users-modal.js";
import { UpdateAssigneeModal } from "./modals/update-assignee.modal.js";
import { ViewIssueModal } from "./modals/view-issue-modal.js";
import type { JiraUser } from "./types/jira-user.js";

const myAccountId = env.JIRA_ACCOUNT_ID;

export const BoardView = () => {
  const { data: board } = useBoardQuery();
  const { data: issues } = useIssueQuery(board?.filter.jql);
  const { mutate: updateIssue } = useUpdateIssueMutation();

  const isFetching = useIsFetching();
  const [filteredUsers, setFilteredUsers] = useState<JiraUser[]>([]);
  const [selectUsersModalOpen, setSelectUsersModalOpen] = useState(false);
  const modals = useAtomValue(modalsAtom);
  const [boardSearch, setBoardSearch] = useAtom(boardSearchAtom);
  const resetBoardSearch = useSetAtom(resetBoardSearchAtom);

  const [searchState, setSearchState] = useAtom(boardSearchStateAtom);
  const [modalIssueId, setModalIssueId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const viewedIssue = useAtomValue(viewedIssueAtom);

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
    { view: "BoardView" },
    (register) => {
      register({
        key: "/",
        name: "Search",
        handler: () => {
          const searchState = store.get(boardSearchStateAtom);
          if (searchState === "disabled") {
            store.set(boardSearchStateAtom, "active");
          }
        },
      });

      register({
        ...CONFIRM_KEY,
        name: "View issue",
        hidden: true,
        when: () => store.get(boardSearchStateAtom) !== "active",
        handler: () => {
          const selectedIssue = store.get(highlightedIssueAtom);

          store.set(viewedIssueAtom, selectedIssue.key);
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
        key: "m",
        name: "Move issue",
        handler: () => {
          openModal("moveIssue");
        },
      });

      register({
        key: "a",
        name: "Change assignee",
        handler: () => {
          openModal("updateAssignee");
        },
      });

      register({
        key: "o",
        name: "Open",
        handler: () => {
          const selectedIssue = store.get(highlightedIssueAtom);

          if (!selectedIssue?.key) {
            return;
          }

          openIssueInBrowser(selectedIssue.key);
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

  const onOpenModal = (type: ModalKey, issueId: string) => {
    setModalIssueId(issueId);
    openModal(type);
  };

  return (
    <>
      {board && issues ? (
        <Board
          boardConfiguration={board}
          issues={filteredIssuesBySearch}
          filteredUsers={filteredUsers.length ? filteredUsers : allUsers}
          ignoreInput={!!selectUsersModalOpen}
          preselectFirstIssue={searchState === "result"}
        />
      ) : (
        <Spinner label="Getting data from Jira" />
      )}
      {board &&
        issues &&
        (searchState === "disabled" ? (
          <Box width={"100%"} justifyContent="space-between">
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
              onConfirmSearch={() => setSearchState("result")}
            />
          </Box>
        ))}

      {!!viewedIssue && <ViewIssueModal openModal={onOpenModal} />}
      {selectUsersModalOpen && (
        <SelectUsersModal
          title={"Select users to show issues from:"}
          selected={filteredUsers.length ? filteredUsers : allUsers}
          options={allUsers}
          onSelect={(selectedUsers) => setFilteredUsers(selectedUsers)}
          onClose={() => setSelectUsersModalOpen(false)}
        />
      )}

      {modals.updatePriority && modalIssueId && (
        <SelectPriorityModal
          onClose={() => closeModal("updatePriority")}
          onSelect={(priority) =>
            updateIssue({
              issueId: modalIssueId,
              fields: {
                priority: { id: priority.value, name: priority.label },
              },
            })
          }
        />
      )}
      {modals.updateAssignee && <UpdateAssigneeModal issueId={modalIssueId} />}
      {modals.moveIssue && (
        <SelectLaneModal onClose={() => closeModal("moveIssue")} />
      )}
    </>
  );
};
