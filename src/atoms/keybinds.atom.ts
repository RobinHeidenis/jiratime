import { atom } from "jotai";
import { atomWithReducer } from "jotai/utils";
import type { Keybind } from "../lib/keybinds/keybinds.js";
import { activeViewAtom } from "./active-view.atom.js";

type RegisterKeybind = { type: "register"; keybind: Keybind; view: string };

type UnregisterKeybind = { type: "unregister"; keybind: Keybind; view: string };

const keybindReducer = (
  prev: Map<string, Keybind[]>,
  action: RegisterKeybind | UnregisterKeybind,
) => {
  const prevKeybinds = prev.get(action.view) ?? [];
  if (action.type === "register") {
    prev.set(action.view, [...prevKeybinds, action.keybind]);
    return new Map(prev);
  }

  if (action.type === "unregister") {
    // Remove the last keybind with the same key

    const lastKeybindIndex = prevKeybinds
      .map((k) => k.key)
      .lastIndexOf(action.keybind.key);

    if (lastKeybindIndex === -1) {
      return new Map(prev);
    }

    const newKeybinds = [
      ...prevKeybinds.slice(0, lastKeybindIndex),
      ...prevKeybinds.slice(lastKeybindIndex + 1),
    ];

    prev.set(action.view, newKeybinds);
    return new Map(prev);
  }

  throw new Error("Invalid action type");
};

export const keybindReducerAtom = atomWithReducer(
  new Map<string, Keybind[]>(),
  keybindReducer,
);

export const activeKeybindsAtom = atom((get) => {
  const activeView = get(activeViewAtom);
  if (!activeView) {
    return [];
  }

  const activeKeybinds = get(keybindReducerAtom);

  return activeKeybinds.get(activeView) ?? [];
});

export const keybindsDisplayAtom = atom((get) => {
  const keybinds = get(activeKeybindsAtom);

  // Only get the last keybinds of each key, as there might be a dialog open with the same keybind as the underlying view

  const keybindsMap = new Map<string, Keybind>(
    keybinds.map((keybind) => [keybind.key, keybind]),
  );

  return Array.from(keybindsMap.values())
    .filter((keybind) => !keybind.hidden)
    .map(toDisplay)
    .join(" | ");
});

function toDisplay(keybind: Keybind) {
  return `${keybind.name}: ${keybind.key}`;
}
