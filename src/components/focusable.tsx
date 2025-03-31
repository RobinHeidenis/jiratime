import { useFocus } from "ink";
import type { ReactNode } from "react";

export const Focusable = ({
  id,
  render,
}: { id: string; render: (args: { isFocused: boolean }) => ReactNode }) => {
  const { isFocused } = useFocus({ id });

  return <>{render({ isFocused })}</>;
};
