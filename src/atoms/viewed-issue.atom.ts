import { atom } from "jotai";

/** The currently selected issue */
export const viewedIssueAtom = atom<null | string>(null);
