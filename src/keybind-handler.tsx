import { type Key, useInput } from "ink";
import { useAtomValue } from "jotai";
import {
  activeKeybindsAtom,
  ignoreKeybindsAtom,
} from "./atoms/keybinds.atom.js";
import type { Keybind } from "./lib/keybinds/keybinds.js";

export const GlobalKeybindHandler = () => {
  const keybinds = useAtomValue(activeKeybindsAtom);

  const ignoreInputs = useAtomValue(ignoreKeybindsAtom);

  useInput(
    (input, key) => {
      for (const keybind of keybinds) {
        if (shouldTrigger(keybind, input, key)) {
          keybind.handler();
        }
      }
    },
    { isActive: !ignoreInputs },
  );

  return null;
};

const shouldTrigger = (
  keybind: Pick<Keybind, "key" | "modifiers" | "aliases">,
  input: string,
  key: Key,
) => {
  const isMatchingBase =
    resolveKey(keybind.key) === input &&
    (!keybind.modifiers?.length ||
      keybind.modifiers.every((modifier) => !!key[modifier]));

  if (isMatchingBase) {
    return true;
  }

  if (!keybind.aliases) {
    return false;
  }

  return keybind.aliases.some((alias) => {
    if (typeof alias === "string") {
      return resolveKey(alias) === input;
    }

    return (
      resolveKey(alias.key) === input &&
      (!alias.modifiers?.length ||
        alias.modifiers.every((modifier) => !!key[modifier]))
    );
  });
};

const resolveKey = (key: string) => {
  if (key === "<space>") return " ";

  if (key === "<enter>" || key === "<return>" || key === "<CR>") return "\r";

  if (key === "<esc>") return "";

  return key;
};
