import { Box } from "ink";
import { useAtomValue } from "jotai";
import { uiAtom } from "../atoms/ui.atom.js";
import { KeybindsDisplay } from "../keybinds-display.js";
import type { Route } from "../routes/routes.js";
import { Router } from "./router.js";

export const AppShell = ({ routes }: { routes: readonly Route[] }) => {
  const ui = useAtomValue(uiAtom);

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <Box
        height="100%"
        width="100%"
        borderStyle="round"
        flexDirection="column"
      >
        <Box flexGrow={1} height="100%">
          <Router routes={routes} />
        </Box>
        {ui.showKeybinds && <KeybindsDisplay />}
      </Box>
    </Box>
  );
};
