import { useAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { previousViewAtom } from "../atoms/active-view.atom.js";
import type { Keybind } from "../lib/keybinds/keybinds.js";
import { registerKeybind as registerKeybindFn } from "../lib/keybinds/keybinds.js";

type UseKeybinds = (
  options: {
    /** The view that the keybinds are associated with, used to determine which keys are listened for. */
    view: string;
    /**
     * Whether to unregister all keybinds when the component unmounts. Needed for modals that should only register
     * their keybinds when they're open.
     */
    unregister?: boolean;
  },
  callback: (register: (keybind: Keybind) => void) => void,
  deps: unknown[],
) => void;

export const useKeybinds: UseKeybinds = (options, callback, deps) => {
  const unregisterKeybindFnsByRegistrar = useRef(
    new Map<string, ReturnType<typeof registerKeybindFn>>(),
  );
  const [prevView, setActiveView] = useAtom(previousViewAtom); // Updates both active & previous views

  // Wrap the callback in useCallback to prevent it from being called on every render, since the callback itself probably isn't wrapped
  const actualCallback = useCallback(callback, deps);

  // Prevent duplicate keybinds from being registered when the component re-renders
  const registerFn = useCallback(
    (keybind: Keybind) => {
      const keybindHash = hash(keybind);
      const seen = unregisterKeybindFnsByRegistrar.current.has(keybindHash);
      if (!seen) {
        unregisterKeybindFnsByRegistrar.current.set(
          keybindHash,
          registerKeybindFn(options.view, keybind),
        );
      }
    },
    [options.view],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: only runs at startup
  useEffect(() => {
    setActiveView(options.view);

    return () => {
      setActiveView(prevView);

      if (options.unregister) {
        for (const unregisterKeybindFn of unregisterKeybindFnsByRegistrar.current.values()) {
          unregisterKeybindFn();
        }
      }
    };
  }, []);

  // Unregister all keybinds when the component unmounts
  useEffect(() => {
    actualCallback(registerFn);
  }, [registerFn, actualCallback, ...deps]);
};

function hash(keybind: Keybind) {
  return JSON.stringify({
    key: keybind.key,
    modifiers: (keybind.modifiers ?? []).toSorted(),
  });
}
