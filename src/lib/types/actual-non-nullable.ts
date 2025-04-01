export type ActualNonNullable<T> = T extends Record<string, unknown>
  ? { [K in keyof T]-?: ActualNonNullable<T[K]> }
  : NonNullable<T>;
