import { Redis } from "ioredis";
import { Job, Queue, Worker } from "bullmq";
import { prisma } from "@indigram/database";
import { env } from "./config.js";
import { processVariant } from "./media-processing.js";

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const queue = new Queue("media-processing", { connection });

const imageVariants = ["ORIGINAL", "WEB", "THUMBNAIL"] as const;
const videoVariants = ["ORIGINAL", "VIDEO_720P", "THUMBNAIL"] as const;

async function fanOut(job: Job<{ postId: string }>) {
  const post = await prisma.post.findUnique({ where: { id: job.data.postId } });
  if (!post) throw new Error(`Post ${job.data.postId} does not exist`);
  const variants = post.mediaType === "IMAGE" ? imageVariants : videoVariants;
  await queue.addBulk(variants.map((variant) => ({
    name: `process-${variant.toLowerCase()}`,
    data: { postId: post.id, variant },
    opts: { jobId: `${post.id}:${variant}`, attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 1000, removeOnFail: 5000 }
  })));
}

async function processJob(job: Job<{ postId: string; variant: "ORIGINAL" | "WEB" | "THUMBNAIL" | "VIDEO_720P" }>) {
  const post = await prisma.post.findUnique({ where: { id: job.data.postId } });
  if (!post) throw new Error(`Post ${job.data.postId} does not exist`);
  await processVariant(post, job.data.variant);
  const expected = post.mediaType === "IMAGE" ? imageVariants : videoVariants;
  const variants = await prisma.mediaVariant.findMany({ where: { postId: post.id }, select: { kind: true } });
  if (expected.every((variant) => variants.some((item) => item.kind === variant))) {
    await prisma.post.updateMany({ where: { id: post.id, status: "PROCESSING" }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  }
}

const worker = new Worker("media-processing", async (job) => {
  if (job.name === "fan-out-media-variants") await fanOut(job);
  else await processJob(job as Job<{ postId: string; variant: "ORIGINAL" | "WEB" | "THUMBNAIL" | "VIDEO_720P" }>);
}, { connection, concurrency: 2 });

worker.on("failed", async (job, error) => {
  if (!job || job.name === "fan-out-media-variants" || job.attemptsMade < (job.opts.attempts ?? 1)) return;
  await prisma.post.updateMany({ where: { id: job.data.postId, status: "PROCESSING" }, data: { status: "FAILED", failureReason: error.message.slice(0, 500) } });
});

const shutdown = async () => {
  await worker.close();
  await queue.close();
  await connection.quit();
  await prisma.$disconnect();
};
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

console.info("Media worker listening");
