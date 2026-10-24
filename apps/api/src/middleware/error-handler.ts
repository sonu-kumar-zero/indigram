import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/errors/app-error.js";
import { logger } from "../shared/logger.js";

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  const requestId = req.id;
  if (error instanceof ZodError) {
    req.log.warn({ err: error, requestId }, "Request validation failed");
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid request", details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) }
    });
    return;
  }
  if (error instanceof AppError) {
    req.log.warn({ err: error, requestId, code: error.code }, "Application error");
    res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
    return;
  }
  logger.error({ err: error, requestId }, "Unhandled request error");
  res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" } });
};
