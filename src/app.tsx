import { ThemeProvider, defaultTheme, extendTheme } from "@inkjs/ui";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { TextProps } from "ink";
import { Provider as JotaiProvider } from "jotai";
import { store } from "./atoms/store.js";
import { AppShell } from "./components/app-shell.js";
import { env } from "./env.js";
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

// Prevent weird cache issues when onboarding
if (!env.onboarded) {
  await persister.removeClient();
}

const customTheme = extendTheme(defaultTheme, {
  components: {
    ConfirmInput: {
      styles: {
        input: ({ isDisabled }): TextProps => ({
          ...defaultTheme.components.ConfirmInput?.styles?.input?.({
            isDisabled,
          }),
          color: isDisabled ? "gray" : "blueBright",
        }),
      },
    },
  },
});

export const App = () => {
  return (
    <JotaiProvider store={store}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <GlobalKeybindHandler />

        <ThemeProvider theme={customTheme}>
          <AppShell routes={ROUTES} />
        </ThemeProvider>
      </PersistQueryClientProvider>
    </JotaiProvider>
  );
};
