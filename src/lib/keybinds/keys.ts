import type { Keybind } from "./keybinds.js";

export const UP_KEY = {
  key: "k",
  aliases: [
    { key: "", modifiers: ["upArrow"] },
    { key: "p", modifiers: ["ctrl"] },
  ],
} satisfies Partial<Keybind>;

export const DOWN_KEY = {
  key: "j",
  aliases: [
    { key: "", modifiers: ["downArrow"] },
    { key: "n", modifiers: ["ctrl"] },
  ],
} satisfies Partial<Keybind>;

export const LEFT_KEY = {
  key: "h",
  aliases: [{ key: "", modifiers: ["leftArrow"] }],
} satisfies Partial<Keybind>;

export const RIGHT_KEY = {
  key: "l",
  aliases: [{ key: "", modifiers: ["rightArrow"] }],
} satisfies Partial<Keybind>;

export const CONFIRM_KEY = {
  key: "<return>",
  aliases: [
    { key: "", modifiers: ["return"] },
    { key: "y", modifiers: ["ctrl"] },
  ],
} satisfies Partial<Keybind>;

export const CLOSE_KEY = {
  key: "q",
  aliases: [{ key: "", modifiers: ["escape"] }],
} satisfies Partial<Keybind>;

export const SPACE_KEY = {
  key: "<space>",
} satisfies Partial<Keybind>;
