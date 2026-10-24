import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../config/env.js";

export const mediaQueueConnection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
export const mediaQueue = new Queue("media-processing", { connection: mediaQueueConnection });
