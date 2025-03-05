import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Box, Text } from "ink";
import { Provider } from "jotai";
import { store } from "./atoms/store.js";
import { BoardView } from "./board-view.js";

const queryClient = new QueryClient();

export const App = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </Provider>
  );
};
