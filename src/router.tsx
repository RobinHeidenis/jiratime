import { useState } from "react";
import { InitialPage } from "./pages/initial.tsx";
import { SetupPage } from "./pages/setup.tsx";
import type { pages } from "./pages.ts";
import { TextAttributes } from "@opentui/core";

export const Router = () => {
  const [page, setPage] = useState<keyof typeof pages>("initial");

  switch (page) {
    case "initial":
      return <InitialPage setPage={setPage} />;
    case "setup":
      return <SetupPage setPage={setPage} />;
    default:
      return (
        <box alignItems="center" justifyContent="center" flexGrow={1}>
          <text attributes={TextAttributes.DIM}>Page not found</text>
        </box>
      );
  }
};
