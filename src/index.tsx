import { render } from "@opentui/react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Provider as JotaiProvider } from "jotai";
import { createFilePersister } from "../dist/lib/query-storage-persister";
import { store } from "./atoms/store.js";
import { env } from "./env.ts";
import { LOG_FILE } from "./lib/constants.ts";
import { Router } from "./router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  },
});

const persister = createFilePersister();

// Prevent weird cache issues when onboarding
if (!env.onboarded) {
  await persister.removeClient();
}

function App() {
  return (
    <JotaiProvider store={store}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <Router />
      </PersistQueryClientProvider>
    </JotaiProvider>
  );
}

await Bun.write(LOG_FILE, "");
render(<App />);
