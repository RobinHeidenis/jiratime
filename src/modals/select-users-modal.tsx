import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { useKeybinds } from "../hooks/use-keybinds.js";
import type { JiraUser } from "../types/jira-user.js";
import { useStdoutDimensions } from "../useStdoutDimensions.js";

export const SelectUsersModal = ({
  title,
  footer,
  options,
  selected: initialSelected,
  onSelect,
  onClose,
}: {
  title: string;
  footer: string;
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
    footer.length + 6,
  );

  useKeybinds(
    "SelectUsersModal",
    (register) => {
      register({
        key: "q",
        name: "Close",
        aliases: [{ key: "", modifiers: ["escape"] }],
        handler: onClose,
      });
    },
    [],
  );

  useInput((input, key) => {
    if (input === "j" || key.downArrow || (key.ctrl && input === "n")) {
      setFocused(Math.min(options.length - 1, focused + 1));
    } else if (input === "k" || key.upArrow || (key.ctrl && input === "p")) {
      setFocused(Math.max(0, focused - 1));
    } else if (input === " ") {
      if (selected.includes(focused)) {
        setSelected((selected) => selected.filter((s) => s !== focused));
      } else {
        setSelected((selected) => [...selected, focused]);
      }
    } else if (key.return || (key.ctrl && input === "y")) {
      onSelect(
        selected.length ? selected.map((index) => options[index]!) : options,
      );
      onClose();
    }
  });

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
      <Text color={"blueBright"}>
        {"   "}
        {footer.padEnd(maxLength - 3, " ")}
      </Text>
    </Box>
  );
};
