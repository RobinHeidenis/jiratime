import type { Keybind } from "./keybinds.js";

export const toKeybindsDisplay = (
  keybinds: ReadonlyArray<
    Pick<Keybind, "name" | "key" | "modifiers" | "hidden">
  >,
) => {
  return keybinds
    .filter((keybind) => !keybind.hidden)
    .map((keybind) => {
      if (keybind.modifiers?.includes("escape")) {
        return `${keybind.name}: <esc>`;
      }

      return `${keybind.name}: ${keybind.key}`;
    })
    .join(" | ");
};
