import { Text } from "ink";
import { useAtomValue } from "jotai";
import { useBoardQuery } from "../api/get-board.query.js";
import { useGetIssueTransitionsQuery } from "../api/get-issue-transitions.query.js";
import { useTransitionIssueMutation } from "../api/transition-issue.mutation.js";
import { highlightedIssueAtom } from "../atoms/highlighted-issue.atom.js";
import { useIssue } from "../hooks/use-issue.js";
import type { Option } from "./select-modal.js";
import { SelectModal } from "./select-modal.js";

export const SelectLaneModal = ({
  onClose,
  issueId: issueIdOverride,
}: {
  onClose: () => void;
  issueId?: string | null;
}) => {
  const { mutate: transitionIssue } = useTransitionIssueMutation();
  const { data: board } = useBoardQuery();
  const issue = useIssue(
    issueIdOverride ?? useAtomValue(highlightedIssueAtom).id,
  );

  const { data: transitions } = useGetIssueTransitionsQuery(
    issue?.id!,
    !!issue,
  );

  if (!transitions || transitions.length === 0 || !board) {
    return <Text>Loading...</Text>;
  }

  const filteredTransitions = board.columnConfig.columns.map((column) => {
    const transition = transitions.find(
      (transition) =>
        !!column.statuses.find((status) => status.id === transition.to.id),
    )!;

    return {
      ...transition,
      to: {
        ...transition.to,
        name: column.name,
      },
    };
  });

  const selectedTransition = filteredTransitions.find(
    (transition) => transition.to.id === issue.fields.status.id,
  );

  return (
    <SelectModal
      options={filteredTransitions.map((transition) => ({
        label: transition.to.name,
        value: transition.id,
        extraData: {
          newStatusId: transition.to.id,
        },
      }))}
      title={`Select lane (${issue.key})`}
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
