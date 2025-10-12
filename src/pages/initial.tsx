import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import { Button } from "../button.tsx";
import { pages } from "../pages.ts";

export const InitialPage = ({
  setPage,
}: {
  setPage: (page: keyof typeof pages) => void;
}) => {
  const [selected, setSelected] = useState(false);

  useKeyboard((key) => {
    if (key.name === "tab") {
      setSelected((s) => !s);
    }
  });

  return (
    <box alignItems="center" justifyContent="center" flexGrow={1}>
      <box justifyContent="center" alignItems="flex-end">
        <ascii-font font="block" text="JiraTime" />
        <text attributes={TextAttributes.DIM}>What are we doing today?</text>
      </box>
      <Button
        label="Start setup"
        selected={selected}
        onSelect={() => setPage(pages.setup)}
        styles={{ marginTop: 2 }}
      />
    </box>
  );
};
