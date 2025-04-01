import type { Keybind } from "./keybinds.js";

export const toKeybindsDisplay = (
  keybinds: ReadonlyArray<
    Pick<Keybind, "name" | "key" | "modifiers" | "hidden">
  >,
) => {
  return keybinds
    .filter((keybind) => !keybind.hidden)
    .map((keybind) => `${keybind.name}: ${keybind.key}`)
    .join(" | ");
};
