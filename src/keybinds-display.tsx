import { Box, Text } from "ink";
import { useAtomValue } from "jotai";
import { keybindsDisplayAtom } from "./atoms/keybinds.atom.js";

export const KeybindsDisplay = () => {
  const keybindsDisplay = useAtomValue(keybindsDisplayAtom);

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
