import { Text } from "ink";
import type { Issue } from "../api/get-issues.query.js";
import { useGetUsersQuery } from "../api/get-users.query.js";
import { type Option, SelectModal } from "./select-modal.js";

export const SelectUserModal = ({
  issue,
  selectedUserId,
  onSelect,
  onClose,
}: {
  issue: Issue;
  selectedUserId: string;
  onSelect: (user: Option) => void;
  onClose: () => void;
}) => {
  const { data: users } = useGetUsersQuery(issue.id);

  if (!users || users.length === 0) {
    return <Text>Loading...</Text>;
  }

  return (
    <SelectModal
      options={users
        .map((user) => ({
          label: user.displayName,
          value: user.accountId,
        }))
        .sort((a, b) => {
          if (a.value === selectedUserId) {
            return -1;
          }

          if (b.value === selectedUserId) {
            return 1;
          }

          return a.label.localeCompare(b.label);
        })}
      title={`Select user (${issue.key})`}
      selected={selectedUserId}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
};
