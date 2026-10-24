import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { authController } from "./auth.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { validateBody } from "../../middleware/validate-request.js";
import {
  changePasswordSchema, forgotPasswordSchema, loginSchema, refreshSchema, registerSchema,
  resetPasswordSchema, tokenSchema, updateProfileSchema
} from "./auth.validation.js";
import { z } from "zod";

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false });
const usernameQuerySchema = z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/);

router.post("/register", authLimiter, validateBody(registerSchema), asyncHandler(authController.register));
router.post("/login", authLimiter, validateBody(loginSchema), asyncHandler(authController.login));
router.post("/refresh", authLimiter, validateBody(refreshSchema), asyncHandler(authController.refresh));
router.post("/logout", authenticate, asyncHandler(authController.logout));
router.post("/logout-all", authenticate, asyncHandler(authController.logoutAll));
router.get("/me", authenticate, asyncHandler(authController.me));
router.patch("/me", authenticate, validateBody(updateProfileSchema), asyncHandler(authController.updateProfile));
router.post("/verify-email", validateBody(tokenSchema), asyncHandler(authController.verifyEmail));
router.post("/resend-verification", authLimiter, validateBody(z.object({ email: z.string().email().transform((v) => v.toLowerCase()) })), asyncHandler(authController.resendVerification));
router.post("/forgot-password", authLimiter, validateBody(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
router.post("/reset-password", authLimiter, validateBody(resetPasswordSchema), asyncHandler(authController.resetPassword));
router.post("/change-password", authenticate, validateBody(changePasswordSchema), asyncHandler(authController.changePassword));
router.get("/sessions", authenticate, asyncHandler(authController.sessions));
router.delete("/sessions/:sessionId", authenticate, asyncHandler(authController.revokeSession));
router.get("/availability/username", (req, res, next) => {
  const result = usernameQuerySchema.safeParse(req.query.username);
  if (!result.success) { next(result.error); return; }
  req.query.username = result.data;
  next();
}, asyncHandler(authController.usernameAvailability));

export { router as authRouter };
