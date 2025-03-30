import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { useStdoutDimensions } from "../useStdoutDimensions.js";

export interface Option {
  label: string;
  value: string;
  color?: string;
  extraData?: Record<string, unknown>;
}
export const SelectModal = ({
  title,
  footer,
  options,
  selected,
  initialFocusOnSelected = true,
  onSelect,
  onClose,
}: {
  title: string;
  footer: string;
  options: Option[];
  selected: string;
  initialFocusOnSelected?: boolean;
  onSelect: (selected: Option) => void;
  onClose: () => void;
}) => {
  const [focused, setFocused] = useState(
    initialFocusOnSelected
      ? options.findIndex((option) => option.value === selected)
      : 0,
  );
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
    footer.length + standardWidth,
  );

  useInput((input, key) => {
    if (input === "j" || key.downArrow || (key.ctrl && input === "n")) {
      setFocused(Math.min(options.length - 1, focused + 1));
    } else if (input === "k" || key.upArrow || (key.ctrl && input === "p")) {
      setFocused(Math.max(0, focused - 1));
    } else if (key.return || (key.ctrl && input === "y")) {
      onSelect(options[focused]!);
      onClose();
    } else if (input === "q" || key.escape) {
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
      <Text color={"blueBright"}>
        {"   "}
        {footer.padEnd(maxLength - 3, " ")}
      </Text>
    </Box>
  );
};
