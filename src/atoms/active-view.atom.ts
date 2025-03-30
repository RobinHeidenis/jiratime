import { atom } from "jotai";

export const activeViewAtom = atom<string | null>(null);

const prevViewStoreAtom = atom<string | null>(null);

// Derived atom that keeps track of the previous view
export const previousViewAtom = atom(
  (get) => get(activeViewAtom), // Read the current value
  (get, set, newView: string | null) => {
    const prev = get(activeViewAtom);
    set(activeViewAtom, newView);
    set(prevViewStoreAtom, prev);
  },
);
