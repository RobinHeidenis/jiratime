import { Box, Text } from "ink";
import { atom } from "jotai";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { store } from "../atoms/store.js";
import { useKeybinds } from "../hooks/use-keybinds.js";
import {
  CLOSE_KEY,
  CONFIRM_KEY,
  DOWN_KEY,
  UP_KEY,
} from "../lib/keybinds/keys.js";
import { useStdoutDimensions } from "../useStdoutDimensions.js";

export interface Option {
  label: string;
  value: string;
  color?: string;
  extraData?: Record<string, unknown>;
}

const focusedAtom = atom(0);

export const SelectModal = ({
  title,
  options,
  selected,
  initialFocusOnSelected = true,
  onSelect,
  onClose,
}: {
  title: string;
  options: Option[];
  selected: string;
  initialFocusOnSelected?: boolean;
  onSelect: (selected: Option) => void;
  onClose: () => void;
}) => {
  const [focused, setFocused] = useAtom(focusedAtom);

  useEffect(() => {
    if (initialFocusOnSelected) {
      setFocused(options.findIndex((option) => option.value === selected));
    }
  }, [initialFocusOnSelected, options, selected, setFocused]);

  const [columns, rows] = useStdoutDimensions();

  const hasColors = options.some((option) => option.color !== undefined);

  // border + padding + arrow + space
  // |   > Option 1 (selected) |
  // |   Option 2              |
  const standardWidth = 1 + 3 + 1 + 1;

  const maxLength = Math.max(
    ...options.map(
      (option) => option.label.length + standardWidth + (!hasColors ? 11 : 0),
    ),
    title.length + standardWidth,
  );

  useKeybinds(
    { view: `SelectModal-${title}`, unregister: true },
    (register) => {
      register({
        ...UP_KEY,
        name: "Up",
        hidden: true,
        handler: () => {
          store.set(focusedAtom, (prev) => Math.max(0, prev - 1));
        },
      });

      register({
        ...DOWN_KEY,
        name: "Down",
        hidden: true,
        handler: () => {
          store.set(focusedAtom, (prev) =>
            Math.min(options.length - 1, prev + 1),
          );
        },
      });

      register({
        ...CONFIRM_KEY,
        name: "Confirm",
        handler: () => {
          const focused = store.get(focusedAtom);
          onSelect(options[focused]!);
          onClose();
        },
      });

      register({
        ...CLOSE_KEY,
        name: "Close",
        handler: onClose,
      });
    },
    [options],
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
          `   ${index === focused ? "> " : " "}${option.label} ${hasColors && option.value === selected ? "(selected) " : " "}`.padEnd(
            maxLength,
            " ",
          );

        return (
          <Text
            key={option.value}
            color={
              index === focused
                ? "blue"
                : !hasColors && selected === option.value
                  ? "green"
                  : (option.color ?? undefined)
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
