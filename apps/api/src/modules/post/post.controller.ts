import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { postService } from "./post.service.js";

function auth(req: Request) {
  const value = (req as AuthenticatedRequest).auth;
  if (!value) throw new Error("authenticate middleware did not set auth context");
  return value.userId;
}

function postId(req: Request) {
  const value = req.params.postId;
  if (typeof value !== "string") throw new Error("postId parameter is missing");
  return value;
}

export const postController = {
  async create(req: Request, res: Response) {
    res.status(201).json({ data: await postService.create(auth(req), req.body) });
  },
  async complete(req: Request, res: Response) {
    res.json({ data: await postService.complete(auth(req), postId(req)) });
  },
  async get(req: Request, res: Response) {
    res.json({ data: await postService.get(auth(req), postId(req)) });
  }
};
