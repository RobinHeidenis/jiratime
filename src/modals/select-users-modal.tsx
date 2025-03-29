import { Box, Text } from "ink";
import { atom, useAtom } from "jotai";
import { useStore } from "jotai";
import { useEffect } from "react";
import { useKeybinds } from "../hooks/use-keybinds.js";
import type { JiraUser } from "../types/jira-user.js";
import { useStdoutDimensions } from "../useStdoutDimensions.js";

const focusedAtom = atom(0);
const selectedAtom = atom<number[]>([]);

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
  const [focused, setFocused] = useAtom(focusedAtom);
  const [selected, setSelected] = useAtom(selectedAtom);
  const [columns, rows] = useStdoutDimensions();
  const store = useStore();

  useEffect(() => {
    setSelected(
      options
        .map((option, i) => (initialSelected.includes(option) ? i : -1))
        .filter((i) => i !== -1),
    );
  }, [setSelected, initialSelected, options]);

  const maxLength = Math.max(
    ...options.map((option) => option.displayName.length + 6),
    title.length + 6,
  );

  useKeybinds(
    "SelectUsersModal",
    (register) => {
      register({
        key: "j",
        hidden: true,
        name: "Down",
        aliases: [
          { key: "", modifiers: ["downArrow"] },
          { key: "n", modifiers: ["ctrl"] },
        ],
        handler: () => {
          setFocused((prev) => Math.min(options.length - 1, prev + 1));
        },
      });

      register({
        key: "k",
        hidden: true,
        name: "Up",
        aliases: [
          { key: "", modifiers: ["upArrow"] },
          { key: "p", modifiers: ["ctrl"] },
        ],
        handler: () => setFocused((prev) => Math.max(0, prev - 1)),
      });

      register({
        key: "<space>",
        name: "Select",
        handler: () => {
          const focusedValue = store.get(focusedAtom);
          const selectedValue = store.get(selectedAtom);

          if (selectedValue.includes(focusedValue)) {
            store.set(
              selectedAtom,
              selectedValue.filter((s) => s !== focusedValue),
            );
          } else {
            store.set(selectedAtom, [...selectedValue, focusedValue]);
          }
        },
      });

      register({
        key: "<return>",
        name: "Select",
        aliases: [
          { key: "", modifiers: ["return"] },
          { key: "y", modifiers: ["ctrl"] },
        ],
        handler: () => {
          const selectedValue = store.get(selectedAtom);
          onSelect(
            selectedValue.length
              ? selectedValue.map((index) => options[index]!)
              : options,
          );
          onClose();
        },
      });

      register({
        key: "q",
        name: "Close",
        aliases: [{ key: "", modifiers: ["escape"] }],
        handler: onClose,
      });
    },
    [],
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
