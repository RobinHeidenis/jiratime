import { Text, useInput } from "ink";

const CURSOR = "█";

export const Search = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  useInput((input, key) => {
    // Hitting backspace counts as delete?
    if (key.delete || key.backspace) {
      onChange(value.slice(0, -1));
    } else {
      onChange(value + input);
    }
  });

  const searchDisplay = `Search: ${value}${CURSOR}`;

  return <Text> {searchDisplay}</Text>;
};
