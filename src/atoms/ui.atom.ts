import { atom } from "jotai";
import { routeAtom } from "./router.atom.js";

type UIState = {
  showKeybinds: boolean;
};

export const uiAtom = atom<UIState>((get) => {
  const activeRoute = get(routeAtom);

  return {
    showKeybinds: activeRoute === "board",
  };
});
