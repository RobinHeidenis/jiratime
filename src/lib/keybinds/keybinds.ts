import type { Key as InkKey } from "ink";
import { keybindReducerAtom } from "../../atoms/keybinds.atom.js";
import { store } from "../../atoms/store.js";

export type InkModifier = Exclude<ModifierKey, "alt"> | keyof InkKey;

type Alias = { key: string; modifiers?: ReadonlyArray<InkModifier> };

export type ModifierKey = "ctrl" | "shift" | "alt";

export type Keybind = {
  key: string;
  modifiers?: ReadonlyArray<InkModifier>;
  aliases?: readonly Alias[];
  name: string;
  handler: () => void;
  description?: string;
  hidden?: boolean;
};

export const registerKeybind = (view: string, keybind: Keybind) => {
  store.set(keybindReducerAtom, { type: "register", keybind, view });

  return () => {
    store.set(keybindReducerAtom, { type: "unregister", keybind, view });
  };
};
