import pino from "pino";
import { pinoHttp } from "pino-http";
import { randomUUID } from "node:crypto";
import type { Request, RequestHandler, Response } from "express";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: "indigram-api", environment: env.NODE_ENV },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password", "newPassword", "currentPassword", "refreshToken", "token"],
    censor: "[REDACTED]"
  }
});

export const requestLogger: RequestHandler = pinoHttp<Request, Response>({
  logger,
  genReqId: (req, res) => {
    const requestId = req.header("x-request-id") || randomUUID();
    res.setHeader("x-request-id", requestId);
    return requestId;
  },
  serializers: {
    req: (req: Request) => ({
      id: req.id,
      method: req.method,
      url: req.originalUrl || req.url,
      remoteAddress: req.ip
    }),
    res: (res: Response) => ({ statusCode: res.statusCode })
  },
  customLogLevel: (_req: Request, res: Response, error?: Error) => {
    if (error || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req: Request, res: Response) => `${req.method} ${req.originalUrl || req.url} ${res.statusCode}`,
  customErrorMessage: (req: Request, res: Response, error: Error) => `${req.method} ${req.originalUrl || req.url} ${res.statusCode}: ${error.message}`
});

export const accessLogger: RequestHandler = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  res.once("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const url = req.originalUrl || req.url;
    logger.info(
      {
        requestId: req.id,
        method: req.method,
        url,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2))
      },
      `API ${req.method} ${url} ${res.statusCode} ${durationMs.toFixed(1)}ms`
    );
  });
  next();
};
