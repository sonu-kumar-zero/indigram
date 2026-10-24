import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../shared/errors/app-error.js";

export type AuthenticatedRequest = Express.Request & { auth?: { userId: string; sessionId: string } };

export const authenticate: RequestHandler = (req, _res, next) => {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));
    return;
  }
  try {
    const payload = jwt.verify(authorization.slice(7), env.ACCESS_TOKEN_SECRET);
    if (typeof payload === "string" || !payload.sub || typeof payload.sid !== "string") {
      throw new Error("Invalid token payload");
    }
    (req as AuthenticatedRequest).auth = { userId: payload.sub, sessionId: payload.sid };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired access token", "INVALID_ACCESS_TOKEN"));
  }
};
