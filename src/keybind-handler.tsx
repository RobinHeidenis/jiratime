import { useInput } from "ink";
import { useAtomValue } from "jotai";
import { activeKeybindsAtom } from "./atoms/keybinds.atom.js";

export const GlobalKeybindHandler = () => {
  const keybinds = useAtomValue(activeKeybindsAtom);

  useInput((input, key) => {
    for (const keybind of keybinds) {
      const hasModifier =
        !keybind.modifiers ||
        keybind.modifiers.every((modifier) => !!key[modifier]);

      if (input === keybind.key && hasModifier) {
        keybind.handler();
      }
    }
  });

  return null;
};
