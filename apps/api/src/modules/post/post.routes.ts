import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody, validateParams } from "../../middleware/validate-request.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { postController } from "./post.controller.js";
import { createPostSchema, postIdParamsSchema } from "./post.validation.js";

export const postRouter = Router();
postRouter.post("/", authenticate, validateBody(createPostSchema), asyncHandler(postController.create));
postRouter.post("/:postId/complete", authenticate, validateParams(postIdParamsSchema), asyncHandler(postController.complete));
postRouter.get("/:postId", authenticate, validateParams(postIdParamsSchema), asyncHandler(postController.get));
