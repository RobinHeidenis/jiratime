import { useQueryClient } from "@tanstack/react-query";
import { Text } from "ink";
import { useAtomValue } from "jotai";
import type { Issue } from "../api/get-issues.query.js";
import { useGetPrioritiesQuery } from "../api/get-priorities.query.js";
import { highlightedIssueAtom } from "../atoms/highlighted-issue.atom.js";
import type { Option } from "./select-modal.js";
import { SelectModal } from "./select-modal.js";

export const SelectPriorityModal = ({
  onSelect,
  onClose,
}: {
  onSelect: (user: Option) => void;
  onClose: () => void;
}) => {
  const highlightedIssue = useAtomValue(highlightedIssueAtom);
  const queryClient = useQueryClient();
  const issues = queryClient.getQueryData(["issues"]) as Issue[];

  const issue = issues?.find((issue) => issue.id === highlightedIssue.id);

  const { data: priorities } = useGetPrioritiesQuery(
    issue?.fields.project.id!,
    !!issue,
  );

  if (!priorities || priorities.length === 0 || !issue) {
    return <Text>Loading...</Text>;
  }

  return (
    <SelectModal
      options={priorities.map((priority) => ({
        label: priority.name,
        value: priority.id,
        color: priority.statusColor,
      }))}
      title={`Select priority (${issue.key})`}
      selected={issue.fields.priority.id}
      onSelect={(choice: Option) => {
        if (choice.value !== issue.fields.priority.id) {
          onSelect(choice);
        } else {
          onClose();
        }
      }}
      onClose={onClose}
    />
  );
};
