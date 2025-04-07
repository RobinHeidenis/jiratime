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
import { viewedIssueAtom } from "./atoms/viewed-issue.atom.js";
import { Board } from "./board.js";
import { SearchInput } from "./components/search.js";
import { env } from "./env.js";
import { useKeybind } from "./hooks/use-keybind.js";
import { copyBranchName } from "./keyboard-handlers/copy-branch-name.js";
import { copyIssueKey } from "./keyboard-handlers/copy-issue-key.js";
import { CommonKey } from "./lib/keybinds/keys.js";
import { SelectLaneModal } from "./modals/select-lane-modal.js";
import { SelectLinkedResourcesModal } from "./modals/select-linked-resources.modal.js";
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

  const [developedByMeFilter, setDevelopedByMeFilter] = useState(false);

  const isFetching = useIsFetching();
  const [filteredUsers, setFilteredUsers] = useState<JiraUser[]>([]);
  const [selectUsersModalOpen, setSelectUsersModalOpen] = useState(false);
  const modals = useAtomValue(modalsAtom);
  const [boardSearch, setBoardSearch] = useAtom(boardSearchAtom);
  const resetBoardSearch = useSetAtom(resetBoardSearchAtom);

  const [highlightedIssue, setHighlightedIssue] = useAtom(highlightedIssueAtom);
  const hasHighlightedIssue = !!highlightedIssue.id;

  const [searchState, setSearchState] = useAtom(boardSearchStateAtom);
  const [modalIssueId, setModalIssueId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const [viewedIssue, setViewedIssue] = useAtom(viewedIssueAtom);

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

    return `Selected users: ${users.map((user) => user.displayName.split(" ")[0]).join(", ")}`;
  }, [filteredUsers, allUsers, developedByMeFilter]);

  const view = "BoardView";

  useKeybind(
    "/",
    {
      view,
      name: "Search",
    },
    () => {
      if (searchState === "disabled") {
        setSearchState("active");
      }
    },
    [searchState, setSearchState],
  );

  useKeybind(
    CommonKey.Confirm,
    {
      view,
      name: "View issue",
      hidden: true,
    },
    () => {
      if (!highlightedIssue || searchState === "active") {
        return;
      }

      setViewedIssue(highlightedIssue.key);
    },
    [setViewedIssue, highlightedIssue, searchState],
  );

  useKeybind(
    "u",
    {
      view,
      name: "Filter users",
    },
    () => setSelectUsersModalOpen(true),
    [],
  );

  useKeybind(
    "shift + m",
    {
      view,
      name: "Assigned to me",
    },
    () => {
      if (!me) {
        return;
      }

      setFilteredUsers((current) => {
        if (current.length === 1 && current[0] === me) {
          return [];
        }

        return [me!];
      });
    },
    [me],
  );

  useKeybind(
    "shift + b",
    {
      view,
      name: "By me",
    },
    () => {
      if (!me) {
        return;
      }

      setDevelopedByMeFilter((current) => !current);
    },
    [me],
  );

  useKeybind(
    "m",
    {
      view,
      name: "Move issue",
    },
    () => {
      openModal("moveIssue");
    },
    [],
  );

  useKeybind(
    "a",
    {
      view,
      name: "Change assignee",
    },
    () => {
      openModal("updateAssignee");
    },
    [],
  );

  useKeybind(
    "o",
    {
      view,
      name: "Linked resources",
    },
    () => {
      openModal("linkedResources");
    },
    [],
  );

  useKeybind(
    "y",
    {
      view,
      name: "Copy ticket number",
      hidden: true,
    },
    () => {
      if (!highlightedIssue?.key) {
        return;
      }

      copyIssueKey({ key: highlightedIssue.key });
    },
    [highlightedIssue],
  );

  useKeybind(
    "shift + y",
    {
      view,
      name: "Copy branch name",
      hidden: true,
    },
    () => {
      if (!highlightedIssue?.key) {
        return;
      }

      copyBranchName(
        highlightedIssue.key,
        highlightedIssue.issueType!,
        highlightedIssue.summary!,
      );
    },
    [highlightedIssue],
  );

  useKeybind(
    "shift + r",
    {
      view,
      name: "Refresh",
    },
    () => queryClient.invalidateQueries(),
    [queryClient],
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
