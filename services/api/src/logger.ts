import type { NextFunction, Request, RequestHandler, Response } from "express";

type LogLevel = "debug" | "info" | "warn" | "error" | "silent";
type LogMeta = Record<string, unknown>;

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 50,
};

const defaultLevel: LogLevel = process.env.NODE_ENV === "test" ? "silent" : "info";
const activeLevel = parseLogLevel(process.env.LOG_LEVEL) ?? defaultLevel;

export const logger = {
  debug(message: string, meta?: LogMeta) {
    writeLog("debug", message, meta);
  },
  info(message: string, meta?: LogMeta) {
    writeLog("info", message, meta);
  },
  warn(message: string, meta?: LogMeta) {
    writeLog("warn", message, meta);
  },
  error(message: string, meta?: LogMeta) {
    writeLog("error", message, meta);
  },
};

export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();
  const startMeta = toRequestStartLogMeta(req);

  logger.info("api.request.start", startMeta);

  if (typeof res.on === "function") {
    res.on("finish", () => {
      const meta = toRequestLogMeta(req, res, Date.now() - startedAt);

      if (res.statusCode >= 500) {
        logger.error("api.request", meta);
        return;
      }

      if (res.statusCode >= 400) {
        logger.warn("api.request", meta);
        return;
      }

      logger.info("api.request", meta);
    });
  }

  next();
};

export function errorLogger(
  error: unknown,
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  logger.error("api.error", {
    method: req.method,
    path: req.originalUrl,
    remoteAddress: getRemoteAddress(req),
    error: serializeError(error),
  });

  next(error);
}

function writeLog(level: Exclude<LogLevel, "silent">, message: string, meta?: LogMeta) {
  if (levelPriority[level] < levelPriority[activeLevel]) {
    return;
  }

  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...serializeMeta(meta),
  });

  if (level === "error") {
    console.error(entry);
    return;
  }

  if (level === "warn") {
    console.warn(entry);
    return;
  }

  if (level === "debug") {
    console.debug(entry);
    return;
  }

  console.info(entry);
}

function toRequestLogMeta(req: Request, res: Response, durationMs: number): LogMeta {
  return {
    method: req.method,
    path: req.originalUrl,
    status: res.statusCode,
    durationMs,
    remoteAddress: getRemoteAddress(req),
    userAgent: req.get("user-agent"),
  };
}

function toRequestStartLogMeta(req: Request): LogMeta {
  return {
    method: req.method,
    path: req.originalUrl,
    remoteAddress: getRemoteAddress(req),
    userAgent: req.get("user-agent"),
  };
}

function getRemoteAddress(req: Request): string | undefined {
  try {
    return req.ip ?? req.socket?.remoteAddress;
  } catch {
    return req.socket?.remoteAddress;
  }
}

function serializeMeta(meta: LogMeta | undefined): LogMeta {
  if (!meta) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => [key, serializeValue(value)]),
  );
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return serializeError(value);
  }

  return value;
}

function serializeError(error: unknown): LogMeta {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

function parseLogLevel(value: string | undefined): LogLevel | undefined {
  if (
    value === "debug" ||
    value === "info" ||
    value === "warn" ||
    value === "error" ||
    value === "silent"
  ) {
    return value;
  }

  return undefined;
}
