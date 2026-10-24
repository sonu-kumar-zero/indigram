import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { followService } from "./follow.service.js";

function userId(req: Request) {
  const id = (req as AuthenticatedRequest).auth?.userId;
  if (!id) throw new Error("authenticate middleware did not set auth context");
  return id;
}

function username(req: Request) {
  const value = req.params.username;
  if (typeof value !== "string") throw new Error("username parameter is missing");
  return value;
}

export const followController = {
  async follow(req: Request, res: Response) {
    res.status(201).json({ data: await followService.follow(userId(req), username(req)) });
  },
  async unfollow(req: Request, res: Response) {
    res.json({ data: await followService.unfollow(userId(req), username(req)) });
  },
  async status(req: Request, res: Response) {
    res.json({ data: await followService.status(userId(req), username(req)) });
  },
  async followers(req: Request, res: Response) {
    res.json({ data: await followService.listFollowers(username(req), Number(req.query.page), Number(req.query.limit)) });
  },
  async following(req: Request, res: Response) {
    res.json({ data: await followService.listFollowing(username(req), Number(req.query.page), Number(req.query.limit)) });
  }
};
