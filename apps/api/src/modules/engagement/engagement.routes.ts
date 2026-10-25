import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate-request.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { engagementController } from "./engagement.controller.js";
import { commentIdParamsSchema, commentListQuerySchema, createCommentSchema, postIdParamsSchema } from "./engagement.validation.js";

export const engagementRouter = Router();
engagementRouter.post("/posts/:postId/like", authenticate, validateParams(postIdParamsSchema), asyncHandler(engagementController.likePost));
engagementRouter.delete("/posts/:postId/like", authenticate, validateParams(postIdParamsSchema), asyncHandler(engagementController.unlikePost));
engagementRouter.get("/posts/:postId/comments", authenticate, validateParams(postIdParamsSchema), validateQuery(commentListQuerySchema), asyncHandler(engagementController.listComments));
engagementRouter.post("/posts/:postId/comments", authenticate, validateParams(postIdParamsSchema), validateBody(createCommentSchema), asyncHandler(engagementController.createComment));
engagementRouter.post("/comments/:commentId/like", authenticate, validateParams(commentIdParamsSchema), asyncHandler(engagementController.likeComment));
engagementRouter.delete("/comments/:commentId/like", authenticate, validateParams(commentIdParamsSchema), asyncHandler(engagementController.unlikeComment));
engagementRouter.delete("/comments/:commentId", authenticate, validateParams(commentIdParamsSchema), asyncHandler(engagementController.deleteComment));
