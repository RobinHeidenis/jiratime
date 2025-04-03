import { Spinner } from "@inkjs/ui";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import clipboard from "clipboardy";
import { Box, Text } from "ink";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
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
import { copyBranchName } from "./keyboard-handlers/copy-branch-name.js";
import { CONFIRM_KEY } from "./lib/keybinds/keys.js";
import { SelectLaneModal } from "./modals/select-lane-modal.js";
import { SelectLinkedResourcesModal } from "./modals/select-linked-resources.modal.js";
import { SelectPriorityModal } from "./modals/select-priority-modal.js";
import { SelectUsersModal } from "./modals/select-users-modal.js";
import { UpdateAssigneeModal } from "./modals/update-assignee.modal.js";
import { ViewIssueModal } from "./modals/view-issue-modal.js";
import type { JiraUser } from "./types/jira-user.js";

const myAccountId = env.JIRA_ACCOUNT_ID;
const byMeFilterAtom = atom(false);

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
  const hasHighlightedIssue = !!useAtomValue(highlightedIssueAtom).id;
  const developedByMeFilter = useAtomValue(byMeFilterAtom);

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

  const filteredIssues = useMemo(() => {
    let results = issues ?? [];

    if (developedByMeFilter) {
      results = results.filter(
        (issue) => issue.fields.developer?.accountId === myAccountId,
      );
    } else if (filteredUsers.length) {
      results = results.filter((issue) =>
        filteredUsers.some(
          (user) => user.accountId === issue.fields.assignee.accountId,
        ),
      );
    }

    if (boardSearch) {
      const needle = boardSearch.toLowerCase();
      results = results.filter(
        (issue) =>
          issue.key.toLowerCase().includes(needle) ||
          issue.fields.summary.toLowerCase().includes(needle),
      );
    }

    return results;
  }, [issues, boardSearch, filteredUsers, developedByMeFilter]);

  const header = useMemo(() => {
    if (developedByMeFilter) {
      return "Filter: Issues developed by me";
    }

    const users = filteredUsers.length ? filteredUsers : allUsers;

    return `Selected users: ${users
      .map((user) => user.displayName.split(" ")[0])
      .join(", ")}`;
  }, [filteredUsers, allUsers, developedByMeFilter]);

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
        when: () =>
          !!store.get(highlightedIssueAtom).id &&
          store.get(boardSearchStateAtom) !== "active",
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

        register({
          key: "B",
          modifiers: ["shift"],
          name: "By me",
          handler: () => {
            store.set(byMeFilterAtom, (current) => !current);
          },
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
        name: "Linked resources",
        handler: () => {
          openModal("linkedResources");
        },
      });

      register({
        key: "y",
        name: "Copy ticket number",
        hidden: true,
        handler: () => {
          const highlightedIssue = store.get(highlightedIssueAtom);

          if (!highlightedIssue?.key) {
            return;
          }

          clipboard.writeSync(highlightedIssue.key);
        },
      });

      register({
        key: "Y",
        modifiers: ["shift"],
        name: "Copy branch name",
        hidden: true,
        handler: () => {
          const highlightedIssue = store.get(highlightedIssueAtom);

          if (!highlightedIssue) {
            return;
          }

          copyBranchName(
            highlightedIssue.key!,
            highlightedIssue.issueType!,
            highlightedIssue.summary!,
          );
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
          issues={filteredIssues}
          ignoreInput={!!selectUsersModalOpen}
          preselectFirstIssue={searchState === "result"}
          heading={header}
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
      {(hasHighlightedIssue || modalIssueId) && selectUsersModalOpen && (
        <SelectUsersModal
          title={"Select users to show issues from:"}
          selected={filteredUsers.length ? filteredUsers : allUsers}
          options={allUsers}
          onSelect={(selectedUsers) => setFilteredUsers(selectedUsers)}
          onClose={() => setSelectUsersModalOpen(false)}
        />
      )}

      {modals.updatePriority &&
        modalIssueId &&
        (hasHighlightedIssue || modalIssueId) && (
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
      {modals.updateAssignee && (hasHighlightedIssue || modalIssueId) && (
        <UpdateAssigneeModal issueId={modalIssueId} />
      )}
      {modals.moveIssue && (hasHighlightedIssue || modalIssueId) && (
        <SelectLaneModal
          issueId={modalIssueId}
          onClose={() => closeModal("moveIssue")}
        />
      )}
      {modals.linkedResources && (hasHighlightedIssue || modalIssueId) && (
        <SelectLinkedResourcesModal
          issueId={modalIssueId}
          onClose={() => closeModal("linkedResources")}
        />
      )}
    </>
  );
};
