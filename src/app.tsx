import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Box, Text } from "ink";
import { Provider } from "jotai";
import { store } from "./atoms/store.js";
import { BoardView } from "./board-view.js";
import { createFilePersister } from "./lib/query-storage-persister.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const persister = createFilePersister();

export const App = () => {
  return (
    <Provider store={store}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <Box flexDirection="column" width={"100%"} height={"100%"}>
          <Text> JIRA TIME</Text>
          <Box
            height={"100%"}
            width={"100%"}
            borderStyle={"round"}
            flexDirection="column"
          >
            <BoardView />
          </Box>
        </Box>
      </PersistQueryClientProvider>
    </Provider>
  );
};
