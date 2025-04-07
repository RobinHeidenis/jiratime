import { describe, expect, test } from "bun:test";
import { parseKeybind } from "./parse-keybind.js";

const A_TO_Z = "abcdefghijklmnopqrstuvwxyz".split("");
const MODIFIERS = ["ctrl", "shift", "alt"] as const;

describe("parseKeybind", () => {
  describe("singular keybinds", () => {
    test("lowercase characters", () => {
      for (const char of A_TO_Z) {
        // @ts-expect-error char is a string
        expect(parseKeybind(char)).toEqual({
          key: char,
          modifiers: [],
        });
      }
    });

    test("escape key", () => {
      for (const key of ["esc", "<esc>", "escape", "<escape>"] as const) {
        expect(parseKeybind(key)).toEqual({
          key: "",
          modifiers: ["escape"],
        });
      }
    });

    test("return key", () => {
      for (const key of ["return", "<return>"] as const) {
        expect(parseKeybind(key)).toEqual({
          key: "<return>",
          modifiers: [],
        });
      }
    });

    test("arrow keys", () => {
      const arrowKeys = ["up", "down", "left", "right"] as const;

      for (const arrowKey of arrowKeys) {
        expect(parseKeybind(`${arrowKey}Arrow`)).toEqual({
          key: "",
          modifiers: [`${arrowKey}Arrow`],
        });
      }
    });

    test("space key", () => {
      expect(parseKeybind("space")).toEqual({
        key: "<space>",
        modifiers: [],
      });
    });
  });

  describe("singular with modifiers", () => {
    test("alt becomes meta modifier", () => {
      expect(parseKeybind("alt + a")).toEqual({
        key: "a",
        modifiers: ["meta"],
      });
    });

    for (const modifier of MODIFIERS) {
      test(`${modifier} + lowercase characters`, () => {
        for (const char of A_TO_Z) {
          // @ts-expect-error char is a string
          expect(parseKeybind(`${modifier} + ${char}`)).toEqual({
            key: modifier === "shift" ? char.toUpperCase() : char,
            modifiers: [modifier === "alt" ? "meta" : modifier],
          });
        }
      });
    }
  });

  describe("multiple keybinds", () => {
    test("two simple keybinds become aliased", () => {
      expect(parseKeybind(["a", "b"])).toEqual({
        key: "a",
        modifiers: [],
        aliases: [{ key: "b", modifiers: [] }],
      });
    });

    test("two keybinds with modifiers become aliased", () => {
      expect(parseKeybind(["ctrl + a", "shift + b"])).toEqual({
        key: "a",
        modifiers: ["ctrl"],
        aliases: [{ key: "B", modifiers: ["shift"] }],
      });
    });

    test("q + escape (close key)", () => {
      expect(parseKeybind(["q", "escape"])).toEqual({
        key: "q",
        modifiers: [],
        aliases: [{ key: "", modifiers: ["escape"] }],
      });
    });

    test("complex multiple keybinds", () => {
      expect(parseKeybind(["ctrl + y", "return", "shift + c"])).toEqual({
        key: "y",
        modifiers: ["ctrl"],
        aliases: [
          { key: "<return>", modifiers: [] },
          { key: "C", modifiers: ["shift"] },
        ],
      });
    });
  });
});
