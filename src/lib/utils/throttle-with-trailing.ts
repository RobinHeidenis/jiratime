export function throttleWithTrailing<
  // biome-ignore lint/suspicious/noExplicitAny: required for generic function
  T extends (...args: any[]) => unknown | Promise<unknown>,
>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: ThisParameterType<T> | null = null;
  let lastCallTime = 0;

  const invoke = () => {
    if (lastArgs) {
      func.apply(lastThis, lastArgs);
      lastArgs = lastThis = null;
      lastCallTime = Date.now();
    }
  };

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      invoke();
    } else if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        invoke();
      }, remaining);
    }
  } as T;
}
