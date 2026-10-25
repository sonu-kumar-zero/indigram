import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { followRouter } from "../modules/follow/follow.routes.js";
import { postRouter } from "../modules/post/post.routes.js";
import { engagementRouter } from "../modules/engagement/engagement.routes.js";

export const apiRouter = Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", followRouter);
apiRouter.use("/posts", postRouter);
apiRouter.use("/", engagementRouter);
