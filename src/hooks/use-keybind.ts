import { useAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { previousViewAtom } from "../atoms/active-view.atom.js";
import type { Keybind } from "../lib/keybinds/keybinds.js";
import { registerKeybind } from "../lib/keybinds/keybinds.js";

type UseKeybind = (
  keybind: Omit<Keybind, "handler">,
  handler: Keybind["handler"],
  options: {
    view: string;
  },
  deps?: unknown[],
) => void;

export const useKeybind: UseKeybind = (
  keybind,
  handler,
  options,
  deps = [],
) => {
  const callbackRef = useRef(handler);
  const [prevView, setActiveView] = useAtom(previousViewAtom);

  // Always use latest callback if deps change
  const memoisedCallback = useCallback(handler, deps);

  useEffect(() => {
    callbackRef.current = memoisedCallback;
  }, [memoisedCallback]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only on mount
  useEffect(() => {
    setActiveView(options.view);

    const unregister = registerKeybind(options.view, {
      ...keybind,
      handler: (...args) => callbackRef.current(...args),
    });

    return () => {
      setActiveView(prevView);
      unregister();
    };
  }, []);
};
