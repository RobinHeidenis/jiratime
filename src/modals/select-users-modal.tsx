import { Box, Text } from "ink";
import { useState } from "react";
import { useKeybind } from "../hooks/use-keybind.js";
import { CommonKey } from "../lib/keybinds/keys.js";
import type { JiraUser } from "../types/jira-user.js";
import { useStdoutDimensions } from "../useStdoutDimensions.js";

export const SelectUsersModal = ({
  title,
  options,
  selected: initialSelected,
  onSelect,
  onClose,
}: {
  title: string;
  options: JiraUser[];
  selected: JiraUser[];
  onSelect: (selected: JiraUser[]) => void;
  onClose: () => void;
}) => {
  const [focused, setFocused] = useState(0);
  const [selected, setSelected] = useState<number[]>(
    options
      .map((option, i) => (initialSelected.includes(option) ? i : -1))
      .filter((i) => i !== -1),
  );
  const [columns, rows] = useStdoutDimensions();

  const maxLength = Math.max(
    ...options.map((option) => option.displayName.length + 6),
    title.length + 6,
  );

  const view = "SelectUsersModal";

  useKeybind(
    CommonKey.Down,
    {
      view,
      hidden: true,
      name: "Down",
    },
    () => {
      setFocused((prev) => Math.min(options.length - 1, prev + 1));
    },
    [options],
  );

  useKeybind(
    CommonKey.Up,
    {
      view,
      hidden: true,
      name: "Up",
    },
    () => {
      setFocused((prev) => Math.max(0, prev - 1));
    },
  );

  useKeybind(
    "space",
    {
      view,
      name: "Select",
    },
    () => {
      if (selected.includes(focused)) {
        setSelected((prev) => prev.filter((s) => s !== focused));
      } else {
        setSelected((prev) => [...prev, focused]);
      }
    },
    [selected, focused],
  );

  useKeybind(
    CommonKey.Confirm,
    {
      view,
      name: "Select",
    },
    () => {
      onSelect(
        selected.length ? selected.map((index) => options[index]!) : options,
      );
      onClose();
    },
    [options, selected, onSelect, onClose],
  );

  useKeybind(
    CommonKey.Close,
    {
      view,
      name: "Close",
    },
    onClose,
  );

  return (
    <Box
      flexDirection="column"
      position="absolute"
      borderStyle={"round"}
      borderColor={"green"}
      marginLeft={Math.floor((columns - (maxLength + 2)) / 2)}
      marginTop={Math.floor((rows - (1 + options.length + 2)) / 2)}
    >
      <Text>
        {"   "}
        {title.padEnd(maxLength - 3, " ")}
      </Text>
      {options.map((option, index) => {
        const text =
          `   ${index === focused ? "> " : " "}${option.displayName} ${selected.includes(index) ? "✓" : " "}`.padEnd(
            maxLength,
            " ",
          );

        return (
          <Text
            key={option.accountId}
            color={
              index === focused
                ? "blue"
                : selected.includes(index)
                  ? "green"
                  : undefined
            }
          >
            {text}
          </Text>
        );
      })}
      <Text>{"".padEnd(maxLength, " ")}</Text>
    </Box>
  );
};
