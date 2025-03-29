import { atom } from "jotai";
import { atomWithReducer } from "jotai/utils";
import type { Keybind } from "../lib/keybinds/keybinds.js";

type RegisterKeybind = { type: "register"; keybind: Keybind };

type UnregisterKeybind = { type: "unregister"; keybind: Keybind };

const keybindReducer = (
  prev: Keybind[],
  action: RegisterKeybind | UnregisterKeybind,
) => {
  if (action.type === "register") {
    return [...prev, action.keybind];
  }

  if (action.type === "unregister") {
    // Remove the last keybind with the same key

    const lastKeybindIndex = prev
      .map((k) => k.key)
      .lastIndexOf(action.keybind.key);

    if (lastKeybindIndex === -1) {
      return prev;
    }

    return [
      ...prev.slice(0, lastKeybindIndex),
      ...prev.slice(lastKeybindIndex + 1),
    ];
  }

  throw new Error("Invalid action type");
};

export const keybindReducerAtom = atomWithReducer([], keybindReducer);

export const activeKeybindsAtom = atom((get) => get(keybindReducerAtom));

export const keybindsDisplayAtom = atom((get) => {
  const keybinds = get(activeKeybindsAtom);

  // Only get the last keybinds of each key, as there might be a dialog open with the same keybind as the underlying view

  const keybindsMap = new Map<string, Keybind>(
    keybinds.map((keybind) => [keybind.key, keybind]),
  );

  return Array.from(keybindsMap.values()).map(toDisplay).join(" | ");
});

function toDisplay(keybind: Keybind) {
  return `${keybind.name}: ${keybind.key}`;
}
