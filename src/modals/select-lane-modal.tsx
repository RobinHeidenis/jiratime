import { useQueryClient } from "@tanstack/react-query";
import { Text } from "ink";
import { useAtomValue } from "jotai";
import { useGetIssueTransitionsQuery } from "../api/get-issue-transitions.query.js";
import type { Issue } from "../api/get-issues.query.js";
import { useTransitionIssueMutation } from "../api/transition-issue.mutation.js";
import { highlightedIssueAtom } from "../atoms/highlighted-issue.atom.js";
import type { Option } from "./select-modal.js";
import { SelectModal } from "./select-modal.js";

export const SelectLaneModal = ({
  onClose,
}: {
  onClose: () => void;
}) => {
  const { mutate: transitionIssue } = useTransitionIssueMutation();
  const highlightedIssue = useAtomValue(highlightedIssueAtom);
  const queryClient = useQueryClient();
  const issues = queryClient.getQueryData(["issues"]) as Issue[];

  const issue = issues.find((issue) => issue.id === highlightedIssue.id)!;

  const { data: transitions } = useGetIssueTransitionsQuery(
    issue?.id!,
    !!issue,
  );

  if (!transitions || transitions.length === 0) {
    return <Text>Loading...</Text>;
  }

  const selectedTransition = transitions.find(
    (transition) => transition.to.id === issue.fields.status.id,
  );

  return (
    <SelectModal
      options={transitions.map((transition) => ({
        label: transition.to.name,
        value: transition.id,
        extraData: {
          newStatusId: transition.to.id,
        },
      }))}
      title={"Select lane"}
      footer={" Confirm: <return> | Cancel: q"}
      selected={selectedTransition!.id}
      onSelect={(choice: Option) => {
        if (choice.value !== selectedTransition!.id) {
          transitionIssue({
            issueId: issue.id,
            transitionId: choice.value,
            newStatusId: choice.extraData!.newStatusId as string,
          });
        } else {
          onClose();
        }
      }}
      onClose={onClose}
    />
  );
};
