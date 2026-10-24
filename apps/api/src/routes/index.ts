import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { followRouter } from "../modules/follow/follow.routes.js";

export const apiRouter = Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", followRouter);
