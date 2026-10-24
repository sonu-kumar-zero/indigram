import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateParams, validateQuery } from "../../middleware/validate-request.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { followController } from "./follow.controller.js";
import { followListQuerySchema, usernameParamsSchema } from "./follow.validation.js";

export const followRouter = Router();
followRouter.get("/discover/latest", authenticate, asyncHandler(followController.latestUsers));
followRouter.post("/:username/follow", authenticate, validateParams(usernameParamsSchema), asyncHandler(followController.follow));
followRouter.delete("/:username/follow", authenticate, validateParams(usernameParamsSchema), asyncHandler(followController.unfollow));
followRouter.get("/:username/follow-status", authenticate, validateParams(usernameParamsSchema), asyncHandler(followController.status));
followRouter.get("/:username/followers", validateParams(usernameParamsSchema), validateQuery(followListQuerySchema), asyncHandler(followController.followers));
followRouter.get("/:username/following", validateParams(usernameParamsSchema), validateQuery(followListQuerySchema), asyncHandler(followController.following));
