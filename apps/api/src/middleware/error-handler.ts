import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/errors/app-error.js";
import { env } from "../config/env.js";

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid request", details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) }
    });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (env.NODE_ENV !== "production") console.error(error);
  res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" } });
};
