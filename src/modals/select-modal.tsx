import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { useKeybind } from "../hooks/use-keybind.js";
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
  const [focused, setFocused] = useState(0);

  useEffect(() => {
    if (initialFocusOnSelected) {
      setFocused(options.findIndex((option) => option.value === selected));
    }
  }, [initialFocusOnSelected, options, selected]);

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

  const view = `SelectModal-${title}`;

  useKeybind(
    {
      ...UP_KEY,
      name: "Up",
      hidden: true,
    },
    () => {
      setFocused((prev) => Math.max(0, prev - 1));
    },
    { view },
    [],
  );

  useKeybind(
    {
      ...DOWN_KEY,
      name: "Down",
      hidden: true,
    },
    () => {
      setFocused((prev) => Math.min(options.length - 1, prev + 1));
    },
    { view },
    [options.length],
  );

  useKeybind(
    {
      ...CONFIRM_KEY,
      name: "Confirm",
    },
    () => {
      onSelect(options[focused]!);
      onClose();
    },
    { view },
    [focused, options, onSelect, onClose],
  );

  useKeybind(
    {
      ...CLOSE_KEY,
      name: "Close",
    },
    onClose,
    { view },
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
