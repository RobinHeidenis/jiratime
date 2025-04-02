import { atom } from "jotai";

export const highlightedIssueAtom = atom<{
  column: number;
  index: number;
  id: null | string;
  key: string | null;
  summary: string | null;
  issueType: string | null;
}>({
  column: 0,
  index: 0,
  id: null,
  key: null,
  summary: null,
  issueType: null,
});
