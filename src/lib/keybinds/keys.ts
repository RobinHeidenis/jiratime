import type { ParsableKeybind } from "./parse-keybind.js";

export const CommonKey = {
  Up: ["k", "upArrow", "ctrl + p"],
  Down: ["j", "downArrow", "ctrl + n"],
  Left: ["h", "leftArrow"],
  Right: ["l", "rightArrow"],
  Confirm: ["return", "ctrl + y"],
  Close: ["q", "escape"],
} as const satisfies Record<string, ParsableKeybind>;
