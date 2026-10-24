import "dotenv/config";
import { Redis } from "ioredis";
import { Job, Queue, Worker } from "bullmq";
import { env } from "./config.js";
import { logger } from "./logger.js";

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const queue = new Queue("media-processing", { connection });

const imageVariants = ["ORIGINAL", "WEB", "THUMBNAIL"] as const;
const videoVariants = ["ORIGINAL", "VIDEO_720P", "THUMBNAIL"] as const;

async function fanOut(job: Job<{ postId: string }>) {
  const startedAt = Date.now();
  logger.info("fan-out job started", { jobId: job.id, postId: job.data.postId, attempt: job.attemptsMade + 1 });
  const { prisma } = await import("@indigram/database");
  const post = await prisma.post.findUnique({ where: { id: job.data.postId } });
  if (!post) throw new Error(`Post ${job.data.postId} does not exist`);
  const variants = post.mediaType === "IMAGE" ? imageVariants : videoVariants;
  await queue.addBulk(variants.map((variant) => ({
    name: `process-${variant.toLowerCase()}`,
    data: { postId: post.id, variant },
    opts: { jobId: `${post.id}-${variant.toLowerCase()}`, attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 1000, removeOnFail: 5000 }
  })));
  logger.info("fan-out jobs enqueued", { jobId: job.id, postId: post.id, mediaType: post.mediaType, variants, durationMs: Date.now() - startedAt });
}

async function processJob(job: Job<{ postId: string; variant: "ORIGINAL" | "WEB" | "THUMBNAIL" | "VIDEO_720P" }>) {
  const startedAt = Date.now();
  logger.info("variant job started", { jobId: job.id, postId: job.data.postId, variant: job.data.variant, attempt: job.attemptsMade + 1 });
  const [{ prisma }, { processVariant }] = await Promise.all([
    import("@indigram/database"),
    import("./media-processing.js")
  ]);
  const post = await prisma.post.findUnique({ where: { id: job.data.postId }, include: { assets: true } });
  if (!post) throw new Error(`Post ${job.data.postId} does not exist`);
  if (!post.assets.length) throw new Error(`Post ${post.id} has no media assets`);
  await Promise.all(post.assets.map((asset) => processVariant({ ...post, ...asset, id: post.id }, job.data.variant, asset.id)));
  await job.updateProgress(100);
  const expected = post.mediaType === "IMAGE" ? imageVariants : videoVariants;
  const variants = await prisma.mediaVariant.findMany({ where: { postId: post.id }, select: { kind: true, assetId: true } });
  const assetCount = post.assets.length;
  if (expected.every((variant) => variants.filter((item) => item.kind === variant).length >= assetCount)) {
    await prisma.post.updateMany({ where: { id: post.id, status: "PROCESSING" }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    logger.info("post published", { postId: post.id, variants: expected, durationMs: Date.now() - startedAt });
  } else {
    logger.info("variant job completed", { jobId: job.id, postId: post.id, variant: job.data.variant, completedVariants: variants.map((item) => item.kind), durationMs: Date.now() - startedAt });
  }
}

const worker = new Worker("media-processing", async (job) => {
  logger.info("job received", { jobId: job.id, name: job.name, data: job.data, attempt: job.attemptsMade + 1 });
  if (job.name === "fan-out-media-variants") await fanOut(job);
  else await processJob(job as Job<{ postId: string; variant: "ORIGINAL" | "WEB" | "THUMBNAIL" | "VIDEO_720P" }>);
}, { connection, concurrency: 2 });

worker.on("completed", (job) => {
  logger.info("job completed", { jobId: job.id, name: job.name, postId: job.data.postId });
});

worker.on("failed", async (job, error) => {
  if (!job) {
    logger.error("job failed without job metadata", { error: error.message });
    return;
  }
  logger.error("job failed", { jobId: job.id, name: job.name, postId: job.data.postId, attempt: job.attemptsMade, maxAttempts: job.opts.attempts, error: error.message, stack: error.stack });
  if (job.attemptsMade < (job.opts.attempts ?? 1)) return;
  const { prisma } = await import("@indigram/database");
  const changed = await prisma.post.updateMany({ where: { id: job.data.postId, status: "PROCESSING" }, data: { status: "FAILED", failureReason: error.message.slice(0, 500) } });
  if (changed.count > 0) logger.error("post marked failed", { postId: job.data.postId, error: error.message });
});

connection.on("connect", () => logger.info("redis connected", { redisUrl: env.REDIS_URL.replace(/\/\/.*@/, "//***@") }));
connection.on("ready", () => logger.info("redis ready"));
connection.on("error", (error: Error) => logger.error("redis error", { error: error.message }));
connection.on("close", () => logger.warn("redis connection closed"));

const shutdown = async () => {
  const { prisma } = await import("@indigram/database");
  await worker.close();
  await queue.close();
  await connection.quit();
  await prisma.$disconnect();
};
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

logger.info("media worker listening", { queue: "media-processing", concurrency: 2 });
