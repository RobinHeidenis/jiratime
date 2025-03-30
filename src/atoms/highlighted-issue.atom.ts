import { atom } from "jotai";

export const highlightedIssueAtom = atom<{
  column: number;
  index: number;
  id: null | string;
  key: string | null;
}>({ column: 0, index: 0, id: null, key: null });
