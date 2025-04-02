import fastRedact from "fast-redact";
import winston from "winston";
import { LOG_FILE } from "./constants.js";

const winstonLogger = winston.createLogger({
  level: "debug",
  exitOnError: false,
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: LOG_FILE }),
    ...(process.env.NODE_ENV === "development"
      ? [
          new winston.transports.File({
            filename: LOG_FILE.replace("app.log", "dev.log"),
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple(),
            ),
          }),
        ]
      : []),
  ],
});

const redact = fastRedact({
  paths: ["*.headers.authorization", "*.headers.Authorization"],
  serialize: false,
});

type LogFn = (message: string, extra?: unknown) => void;

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Creates a log function for the given log level.
 * By default, pino only logs the extra object if the first argument is an object,
 * so we need to handle both cases.
 */
const makeLogFn = (level: LogLevel, prefix?: string): LogFn => {
  const logFn: LogFn = (message, extra) => {
    // clone to prevent mutating the input
    const redacted =
      typeof extra === "object" ? redact(structuredClone(extra)) : extra;
    winstonLogger.log({
      level,
      message: maybePrefix(prefix, message),
      data: redacted,
    });
  };

  return logFn;
};

/**
 * Creates a logger with the given prefix
 */
export const makeLogger = (prefix?: string): Logger => {
  return {
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

export type Logger = Record<LogLevel, LogFn> & {
  child: (prefix: string) => Logger;
};

export const logger: Logger = makeLogger();
