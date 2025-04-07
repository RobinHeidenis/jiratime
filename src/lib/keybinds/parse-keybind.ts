import type { InkModifier, Keybind, ModifierKey } from "./keybinds.js";

export function parseKeybind<TKeyOrKeys extends Key | [Key, ...Key[]]>(
  keyOrKeys: TKeyOrKeys,
): TKeyOrKeys extends Key[]
  ? Pick<Keybind, "key" | "modifiers" | "aliases">
  : Pick<Keybind, "key" | "modifiers"> {
  if (Array.isArray(keyOrKeys)) {
    // Note: using destructuring ([mainKeybind, ...aliases] = keyOrKeys) causes aliases to be a string[]
    const [mainKeybind] = keyOrKeys;
    const aliases = keyOrKeys.slice(1);

    return {
      ...parseKeybind(mainKeybind),
      aliases: aliases.map((keybind) => parseKeybind(keybind)),
    } as Pick<Keybind, "key" | "modifiers" | "aliases">;
  }

  return parseSingleKeybind(keyOrKeys);
}

function parseSingleKeybind(keybind: Key): Pick<Keybind, "key" | "modifiers"> {
  if (!keybind.includes("+")) {
    if (
      keybind === "esc" ||
      keybind === "escape" ||
      keybind === "<esc>" ||
      keybind === "<escape>"
    ) {
      return { key: "", modifiers: ["escape"] };
    }

    if (keybind === "return" || keybind === "<return>") {
      return { key: "<return>", modifiers: [] };
    }

    if (
      keybind === "upArrow" ||
      keybind === "downArrow" ||
      keybind === "leftArrow" ||
      keybind === "rightArrow"
    ) {
      return { key: "", modifiers: [keybind] };
    }

    if (keybind === "space") {
      return { key: "<space>", modifiers: [] };
    }

    return { key: keybind, modifiers: [] };
  }

  const [modifier, alphabeticalKey] = parseModifier(keybind);

  return {
    key: alphabeticalKey,
    modifiers: [modifier],
  };
}

function parseModifier(keybind: string): [InkModifier, AlphabeticalKey] {
  const [modifier, alphabeticalKey] = keybind.split(" + ");
  if (modifier === "alt") {
    return ["meta" as const, alphabeticalKey as AlphabeticalKey];
  }

  if (modifier === "shift") {
    return [
      "shift" as const,
      alphabeticalKey?.toUpperCase() as AlphabeticalKey,
    ];
  }

  return [modifier as InkModifier, alphabeticalKey as AlphabeticalKey];
}

type Key =
  | AlphabeticalKey
  | KeyCombination
  | "esc"
  | "<esc>"
  | "escape"
  | "<escape>"
  | "return"
  | "<return>"
  | "upArrow"
  | "rightArrow"
  | "leftArrow"
  | "downArrow"
  | "space"
  | "/";

type KeyCombination = `${ModifierKey} + ${AlphabeticalKey}`;

type AlphabeticalKey =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";

export type ParsableKeybind = readonly Key[];
