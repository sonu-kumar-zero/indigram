import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import type { AuthenticatedRequest } from "../../middleware/authenticate.js";

function clientInfo(req: Request) {
  return {
    ...(req.get("user-agent") ? { userAgent: req.get("user-agent") } : {}),
    ...(req.ip ? { ipAddress: req.ip } : {})
  };
}
function auth(req: Request) {
  const context = (req as AuthenticatedRequest).auth;
  if (!context) throw new Error("authenticate middleware did not set auth context");
  return context;
}

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body, clientInfo(req));
    res.status(201).json({ data: result });
  },
  async login(req: Request, res: Response) {
    res.json({ data: await authService.login(req.body, clientInfo(req)) });
  },
  async refresh(req: Request, res: Response) {
    res.json({ data: await authService.refresh(req.body.refreshToken) });
  },
  async logout(req: Request, res: Response) {
    const context = auth(req);
    res.json({ data: await authService.logout(context.sessionId, context.userId) });
  },
  async logoutAll(req: Request, res: Response) {
    res.json({ data: await authService.logoutAll(auth(req).userId) });
  },
  async me(req: Request, res: Response) {
    res.json({ data: await authService.me(auth(req).userId) });
  },
  async updateProfile(req: Request, res: Response) {
    res.json({ data: await authService.updateProfile(auth(req).userId, req.body) });
  },
  async avatarUpload(req: Request, res: Response) {
    res.json({ data: await authService.avatarUpload(auth(req).userId, req.body) });
  },
  async verifyEmail(req: Request, res: Response) {
    res.json({ data: await authService.verifyEmail(req.body.token) });
  },
  async resendVerification(req: Request, res: Response) {
    res.json({ data: await authService.resendVerification(req.body.email) });
  },
  async forgotPassword(req: Request, res: Response) {
    res.json({ data: await authService.forgotPassword(req.body.email) });
  },
  async resetPassword(req: Request, res: Response) {
    res.json({ data: await authService.resetPassword(req.body.token, req.body.newPassword) });
  },
  async changePassword(req: Request, res: Response) {
    const result = await authService.changePassword(auth(req).userId, req.body.currentPassword, req.body.newPassword);
    res.json({ data: result });
  },
  async sessions(req: Request, res: Response) {
    res.json({ data: await authService.sessions(auth(req).userId) });
  },
  async revokeSession(req: Request, res: Response) {
    const { sessionId } = req.params;

    if (typeof sessionId !== "string" || !sessionId) {
      return res.json({ data: { message: "Invalid session Id" } });
    }

    res.json({
      data: await authService.revokeSession(auth(req).userId, sessionId),
    });
  },
  async usernameAvailability(req: Request, res: Response) {
    const username = String(req.query.username ?? "");
    res.json({ data: await authService.usernameAvailability(username) });
  }
};
