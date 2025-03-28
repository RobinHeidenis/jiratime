import { atom } from "jotai";

export const boardSearchAtom = atom("");

export const boardSearchStateAtom = atom<"active" | "result" | "disabled">(
  "disabled",
);

export const resetBoardSearchAtom = atom(null, (get, set) => {
  set(boardSearchAtom, "");
  set(boardSearchStateAtom, "disabled");
});

export const activateBoardSearchAtom = atom(null, (get, set) => {
  set(boardSearchStateAtom, "active");
});

export const deactivateBoardSearchAtom = atom(null, (get, set) => {
  set(boardSearchStateAtom, "result");
});
