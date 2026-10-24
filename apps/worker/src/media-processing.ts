import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp, { type Metadata } from "sharp";
import type { MediaType } from "@prisma/client";
import { prisma } from "@indigram/database";
import { download, upload } from "./storage.js";
import { logger } from "./logger.js";

const execFileAsync = promisify(execFile);
type Variant = "ORIGINAL" | "WEB" | "THUMBNAIL" | "VIDEO_720P";

function key(postId: string, variant: Variant, extension: string) {
  return `processed/${postId}/${variant.toLowerCase()}-${randomUUID()}.${extension}`;
}

async function ffmpeg(input: Buffer, args: string[], outputExtension: string, postId: string, variant: Variant) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "indigram-media-"));
  const inputPath = path.join(directory, "input");
  const outputPath = path.join(directory, `output.${outputExtension}`);
  try {
    await fs.writeFile(inputPath, input);
    logger.info("ffmpeg started", { postId, variant, outputExtension });
    await execFileAsync("ffmpeg", ["-y", "-i", inputPath, ...args, outputPath], { maxBuffer: 1024 * 1024 });
    return Buffer.from(await fs.readFile(outputPath));
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

export async function processVariant(post: { id: string; mediaType: MediaType; sourceKey: string; sourceMimeType: string }, variant: Variant) {
  const startedAt = Date.now();
  logger.info("variant processing started", { postId: post.id, variant, mediaType: post.mediaType });
  const source = await download(post.sourceKey);
  logger.info("source downloaded", { postId: post.id, variant, bytes: source.length });
  let body: Buffer<ArrayBufferLike> = source;
  let mimeType = post.sourceMimeType;
  let extension = post.sourceMimeType.split("/")[1]?.split("+")[0] ?? "bin";

  if (post.mediaType === "IMAGE" && variant === "WEB") {
    body = await sharp(source).rotate().webp({ quality: 82 }).toBuffer();
    mimeType = "image/webp";
    extension = "webp";
  } else if (post.mediaType === "IMAGE" && variant === "THUMBNAIL") {
    body = await sharp(source).rotate().resize(512, 512, { fit: "cover" }).webp({ quality: 80 }).toBuffer();
    mimeType = "image/webp";
    extension = "webp";
  } else if (post.mediaType === "VIDEO" && variant === "VIDEO_720P") {
    body = await ffmpeg(source, ["-vf", "scale=-2:720", "-c:v", "libx264", "-preset", "fast", "-crf", "23"], "mp4", post.id, variant);
    mimeType = "video/mp4";
    extension = "mp4";
  } else if (post.mediaType === "VIDEO" && variant === "THUMBNAIL") {
    body = await ffmpeg(source, ["-frames:v", "1"], "jpg", post.id, variant);
    mimeType = "image/jpeg";
    extension = "jpg";
  }

  const objectKey = key(post.id, variant, extension);
  await upload(objectKey, body, mimeType);
  logger.info("variant uploaded", { postId: post.id, variant, bytes: body.length, objectKey, durationMs: Date.now() - startedAt });
  const metadata: Metadata | undefined = variant === "WEB" || variant === "THUMBNAIL" ? await sharp(body).metadata() : undefined;
  await prisma.mediaVariant.upsert({
    where: { postId_kind: { postId: post.id, kind: variant } },
    create: { postId: post.id, kind: variant, objectKey, mimeType, size: body.length, ...(metadata?.width ? { width: metadata.width } : {}), ...(metadata?.height ? { height: metadata.height } : {}) },
    update: { objectKey, mimeType, size: body.length, width: metadata?.width, height: metadata?.height }
  });
  logger.info("variant processing completed", { postId: post.id, variant, durationMs: Date.now() - startedAt });
}
