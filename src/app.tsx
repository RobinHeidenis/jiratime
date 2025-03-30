import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Provider as JotaiProvider } from "jotai";
import { store } from "./atoms/store.js";
import { AppShell } from "./components/app-shell.js";
import { GlobalKeybindHandler } from "./keybind-handler.js";
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
        <AppShell routes={ROUTES} />
      </PersistQueryClientProvider>
    </JotaiProvider>
  );
};
