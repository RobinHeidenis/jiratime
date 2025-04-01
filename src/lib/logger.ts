import { pino } from "pino";
import { LOG_FILE } from "./constants.js";

const pinoLogger = pino({
  level: "trace",
  transport: {
    targets: [
      {
        level: "trace",
        target: "pino/file",
        options: {
          destination: LOG_FILE,
        },
      },
    ],
  },
  redact: ["*.headers.authorization", "*.headers.Authorization"],
  base: undefined, // remove pid, hostname from logs
});

interface LogFn {
  (message: string, extra?: unknown): void;
  (extra: object, message?: string): void;
}

/**
 * Creates a log function for the given log level.
 * By default, pino only logs the extra object if the first argument is an object,
 * so we need to handle both cases.
 */
const makeLogFn = (level: pino.Level, prefix?: string): LogFn => {
  const logFn: LogFn = (first, second) => {
    if (typeof first === "object") {
      pinoLogger[level](
        first,
        maybePrefix(prefix, second as string | undefined),
      );
    } else {
      pinoLogger[level](second, maybePrefix(prefix, first));
    }
  };

  return logFn;
};

/**
 * Creates a logger with the given prefix
 */
export const makeLogger = (prefix?: string): Logger => {
  return {
    trace: makeLogFn("trace", prefix),
    debug: makeLogFn("debug", prefix),
    info: makeLogFn("info", prefix),
    warn: makeLogFn("warn", prefix),
    error: makeLogFn("error", prefix),
    fatal: makeLogFn("fatal", prefix),
    child: (nestedPrefix: string) => {
      // Ideally we just use pino.child(), but then we lose our custom log functions, and the usage
      // of pino.child() is weird if you want to provide a prefix
      const myPrefix = nestedPrefix ? `${prefix}.${nestedPrefix}` : prefix;
      return makeLogger(myPrefix);
    },
  };
};

const maybePrefix = (prefix: string | undefined, message = "") => {
  if (!prefix) {
    return message;
  }

  return `[${prefix}] ${message}`;
};

export type Logger = Record<pino.Level, LogFn> & {
  child: (prefix: string) => Logger;
};

export const logger: Logger = makeLogger();
