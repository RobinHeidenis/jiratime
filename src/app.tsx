import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Box } from "ink";
import { Provider as JotaiProvider } from "jotai";
import { store } from "./atoms/store.js";
import { Router } from "./components/router.js";
import { GlobalKeybindHandler } from "./keybind-handler.js";
import { KeybindsDisplay } from "./keybinds-display.js";
import { createFilePersister } from "./lib/query-storage-persister.js";
import { ROUTES } from "./routes/routes.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  },
});

const persister = createFilePersister();

export const App = () => {
  return (
    <JotaiProvider store={store}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <GlobalKeybindHandler />
        <Box flexDirection="column" width={"100%"} height={"100%"}>
          <Box
            height={"100%"}
            width={"100%"}
            borderStyle={"round"}
            flexDirection="column"
          >
            <Box flexGrow={1} height={"100%"}>
              <Router routes={ROUTES} />
            </Box>
            <KeybindsDisplay />
          </Box>
        </Box>
      </PersistQueryClientProvider>
    </JotaiProvider>
  );
};
