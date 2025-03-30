import { useAtomValue } from "jotai";
import { useUpdateIssueMutation } from "../api/update-issue.mutation.js";
import { highlightedIssueAtom } from "../atoms/highlighted-issue.atom.js";
import { closeModal } from "../atoms/modals.atom.js";
import { useIssue } from "../hooks/use-issue.js";
import { SelectUserModal } from "./select-user-modal.js";

export const UpdateAssigneeModal = ({
  issueId: issueIdOverride,
}: { issueId?: string | null }) => {
  const issue = useIssue(
    issueIdOverride ?? useAtomValue(highlightedIssueAtom).id,
  );
  const { mutate: updateIssue } = useUpdateIssueMutation();

  if (!issue) {
    return null;
  }

  return (
    <SelectUserModal
      issue={issue}
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
