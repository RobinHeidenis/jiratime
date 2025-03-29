import { useCallback, useEffect, useRef } from "react";
import type { Keybind } from "../lib/keybinds/keybinds.js";
import { registerKeybind as registerKeybindFn } from "../lib/keybinds/keybinds.js";

type UseKeybinds = (
  callback: (register: (keybind: Keybind) => void) => void,
  deps: unknown[],
) => void;

export const useKeybinds: UseKeybinds = (callback, deps) => {
  const unregisterKeybindFnsByRegistrar = useRef(
    new Map<string, ReturnType<typeof registerKeybindFn>>(),
  );

  // Wrap the callback in useCallback to prevent it from being called on every render, since the callback itself probably isn't wrapped
  const actualCallback = useCallback(callback, deps);

  // Prevent duplicate keybinds from being registered when the component re-renders
  const registerFn = useCallback((keybind: Keybind) => {
    const keybindHash = hash(keybind);
    const seen = unregisterKeybindFnsByRegistrar.current.has(keybindHash);
    if (!seen) {
      unregisterKeybindFnsByRegistrar.current.set(
        keybindHash,
        registerKeybindFn(keybind),
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      for (const unregisterKeybind of unregisterKeybindFnsByRegistrar.current.values()) {
        unregisterKeybind();
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
    modifiers: keybind.modifiers ?? [],
  });
}
