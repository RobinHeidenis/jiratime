import { useAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { previousViewAtom } from "../atoms/active-view.atom.js";
import type { Keybind } from "../lib/keybinds/keybinds.js";
import { registerKeybind } from "../lib/keybinds/keybinds.js";
import { parseKeybind } from "../lib/keybinds/parse-keybind.js";

type UseKeybind = (
  keybind: Readonly<Parameters<typeof parseKeybind>[0]>,
  options: {
    view: string;
    name: string;
    description?: string;
    hidden?: boolean;
  },
  handler: Keybind["handler"],
  deps?: unknown[],
) => void;

export const useKeybind: UseKeybind = (
  keybind,
  { view, ...keybindOptions },
  handler,
  deps = [],
) => {
  const parsedKeybind: Omit<Keybind, "handler"> = {
    ...parseKeybind(keybind),
    ...keybindOptions,
  };

  const callbackRef = useRef(handler);
  const [prevView, setActiveView] = useAtom(previousViewAtom);

  // Always use latest callback if deps change
  const memoisedCallback = useCallback(handler, deps);

  useEffect(() => {
    callbackRef.current = memoisedCallback;
  }, [memoisedCallback]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only on mount
  useEffect(() => {
    setActiveView(view);

    const unregister = registerKeybind(view, {
      ...parsedKeybind,
      handler: (...args) => callbackRef.current(...args),
    });

    return () => {
      setActiveView(prevView);
      unregister();
    };
  }, []);
};
