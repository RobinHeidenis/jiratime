import { Box, Text } from "ink";
import { useMemo } from "react";
import { toKeybindsDisplay } from "../lib/keybinds/to-keybinds-display.js";

export const Keybinds = ({
  keybinds,
}: {
  keybinds: Parameters<typeof toKeybindsDisplay>[0];
}) => {
  const keybindsDisplay = useMemo(
    () => toKeybindsDisplay(keybinds),
    [keybinds],
  );

  return (
    <Box
      width="100%"
      margin={0}
      padding={0}
      borderLeft={false}
      borderBottom={false}
      borderRight={false}
      borderStyle="round"
      borderColor="white"
    >
      <Text color="blueBright">{` ${keybindsDisplay}`}</Text>
    </Box>
  );
};
