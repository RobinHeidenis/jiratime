import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import type { Issue } from "../api/get-issues.query.js";
import { useUpdateIssueMutation } from "../api/update-issue.mutation.js";
import { highlightedIssueAtom } from "../atoms/highlighted-issue.atom.js";
import { closeModal } from "../atoms/modals.atom.js";
import { SelectUserModal } from "./select-user-modal.js";

export const UpdateAssigneeModal = () => {
  const highlightedIssue = useAtomValue(highlightedIssueAtom);
  const { mutate: updateIssue } = useUpdateIssueMutation();
  const queryClient = useQueryClient();
  const issues = queryClient.getQueryData(["issues"]) as Issue[];

  if (!issues) return <></>;

  const issue = issues.find((issue) => issue.id === highlightedIssue.id)!;

  return (
    <SelectUserModal
      issueId={issue.id}
      selectedUserId={issue.fields.assignee.accountId}
      onClose={() => closeModal("updateAssignee")}
      onSelect={(user) =>
        updateIssue({
          issueId: issue.id,
          fields: {
            assignee: { accountId: user.value, displayName: user.label },
          },
        })
      }
    />
  );
};
