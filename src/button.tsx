import { type BoxProps, useKeyboard } from "@opentui/react";

export const Button = ({
  label,
  selected,
  onSelect,
  styles,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  styles?: Omit<BoxProps, "children">;
}) => {
  useKeyboard((key) => {
    if (selected && (key.name === "return" || key.name === "space")) {
      onSelect();
    }
  });

  return (
    <box
      borderStyle="rounded"
      borderColor={selected ? "brightGreen" : "white"}
      paddingLeft={1}
      paddingRight={1}
      {...styles}
    >
      <text>{label}</text>
    </box>
  );
};
