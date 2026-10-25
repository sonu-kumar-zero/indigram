import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { engagementService } from "./engagement.service.js";

function userId(req: Request) {
  const id = (req as AuthenticatedRequest).auth?.userId;
  if (!id) throw new Error("authenticate middleware did not set auth context");
  return id;
}
function param(req: Request, name: string) {
  const value = req.params[name];
  if (typeof value !== "string") throw new Error(`${name} parameter is missing`);
  return value;
}

export const engagementController = {
  async likePost(req: Request, res: Response) { res.status(201).json({ data: await engagementService.likePost(userId(req), param(req, "postId")) }); },
  async unlikePost(req: Request, res: Response) { res.json({ data: await engagementService.unlikePost(userId(req), param(req, "postId")) }); },
  async likeComment(req: Request, res: Response) { res.status(201).json({ data: await engagementService.likeComment(userId(req), param(req, "commentId")) }); },
  async unlikeComment(req: Request, res: Response) { res.json({ data: await engagementService.unlikeComment(userId(req), param(req, "commentId")) }); },
  async createComment(req: Request, res: Response) { res.status(201).json({ data: await engagementService.createComment(userId(req), param(req, "postId"), req.body.content, req.body.parentId) }); },
  async listComments(req: Request, res: Response) { res.json({ data: await engagementService.listComments(userId(req), param(req, "postId"), Number(req.query.page), Number(req.query.limit)) }); },
  async deleteComment(req: Request, res: Response) { res.json({ data: await engagementService.deleteComment(userId(req), param(req, "commentId")) }); }
};
