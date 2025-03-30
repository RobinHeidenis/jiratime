import { Box, Text } from "ink";
import { useSetAtom } from "jotai";
import { routeAtom } from "../atoms/router.atom.js";
import { useKeybinds } from "../hooks/use-keybinds.js";

export const Onboarding = () => {
  const setRoute = useSetAtom(routeAtom);

  useKeybinds(
    { view: "Onboarding", unregister: true },
    (register) => {
      register({
        key: "t",
        name: "Continue",
        handler: () => {
          setRoute("board");
        },
      });
    },
    [],
  );

  return (
    <Box flexDirection="column">
      <Text>Onboarding</Text>
      <Text>Press T to continue</Text>
    </Box>
  );
};
