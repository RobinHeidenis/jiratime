import type { ActualNonNullable } from "../types/actual-non-nullable.js";

export const asNonNullable = <T>(value: T): ActualNonNullable<T> =>
  value as ActualNonNullable<T>;
