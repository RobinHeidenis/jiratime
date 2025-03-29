import type { Key } from "ink";
import { keybindReducerAtom } from "../../atoms/keybinds.atom.js";
import { store } from "../../atoms/store.js";

export type Keybind = {
  key: string;
  modifiers?: ReadonlyArray<keyof Key>;
  handler: () => void;
  name: string;
  description?: string;
};

export const registerKeybind = (keybind: Keybind) => {
  store.set(keybindReducerAtom, { type: "register", keybind });

  return () => {
    unregisterKeybind(keybind);
  };
};

export const unregisterKeybind = (keybind: Keybind) => {
  store.set(keybindReducerAtom, { type: "unregister", keybind });
};
