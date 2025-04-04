import { Box, Text } from "ink";
import { atom, useAtom } from "jotai";
import { useStore } from "jotai";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useKeybinds } from "../hooks/use-keybinds.js";
import {
  CLOSE_KEY,
  CONFIRM_KEY,
  DOWN_KEY,
  SPACE_KEY,
  UP_KEY,
} from "../lib/keybinds/keys.js";
import type { JiraUser } from "../types/jira-user.js";
import { useStdoutDimensions } from "../useStdoutDimensions.js";

const focusedAtom = atom(0);
const selectedAtom = atom<number[]>([]);
const optionsAtom = atom<JiraUser[]>([]);

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
  const focused = useAtomValue(focusedAtom);
  const [selected, setSelected] = useAtom(selectedAtom);
  const [columns, rows] = useStdoutDimensions();
  const store = useStore();

  useEffect(() => {
    setSelected(
      options
        .map((option, i) => (initialSelected.includes(option) ? i : -1))
        .filter((i) => i !== -1),
    );

    store.set(optionsAtom, options);
  }, [setSelected, initialSelected, options, store.set]);

  const maxLength = Math.max(
    ...options.map((option) => option.displayName.length + 6),
    title.length + 6,
  );

  useKeybinds(
    { view: "SelectUsersModal", unregister: true },
    (register) => {
      register({
        ...DOWN_KEY,
        hidden: true,
        name: "Down",
        handler: () => {
          const options = store.get(optionsAtom);

          store.set(focusedAtom, (prev) =>
            Math.min(options.length - 1, prev + 1),
          );
        },
      });

      register({
        ...UP_KEY,
        hidden: true,
        name: "Up",
        handler: () => {
          store.set(focusedAtom, (prev) => Math.max(0, prev - 1));
        },
      });

      register({
        ...SPACE_KEY,
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
        ...CONFIRM_KEY,
        name: "Select",
        handler: () => {
          const selectedValue = store.get(selectedAtom);
          const options = store.get(optionsAtom);
          onSelect(
            selectedValue.length
              ? selectedValue.map((index) => options[index]!)
              : options,
          );
          onClose();
        },
      });

      register({
        ...CLOSE_KEY,
        name: "Close",
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
