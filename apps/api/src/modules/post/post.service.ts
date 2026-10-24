import { randomUUID } from "node:crypto";
import { AppError } from "../../shared/errors/app-error.js";
import { mediaQueue } from "../../shared/media-queue.js";
import { downloadUrl, uploadUrl } from "../../shared/media-storage.js";
import { postRepository } from "./post.repository.js";

export const postService = {
  async create(authorId: string, input: { mediaType: "IMAGE" | "VIDEO"; mimeType: string; size: number; caption?: string }) {
    const postId = randomUUID();
    const extension = input.mimeType.split("/")[1]?.split("+")[0] ?? "bin";
    const sourceKey = `originals/${authorId}/${postId}/source.${extension}`;
    const post = await postRepository.create({ authorId, mediaType: input.mediaType, sourceKey, sourceMimeType: input.mimeType, sourceSize: input.size, ...(input.caption ? { caption: input.caption } : {}) });
    return { postId: post.id, status: post.status, uploadUrl: await uploadUrl(sourceKey, input.mimeType), uploadMethod: "PUT", uploadHeaders: { "content-type": input.mimeType }, expiresIn: 900 };
  },

  async complete(authorId: string, postId: string) {
    const post = await postRepository.findOwned(postId, authorId);
    if (!post) throw new AppError(404, "Post not found", "POST_NOT_FOUND");
    const changed = await postRepository.markProcessing(postId, authorId);
    if (changed.count === 0) throw new AppError(409, "Post has already been submitted", "POST_ALREADY_SUBMITTED");
    await mediaQueue.add("fan-out-media-variants", { postId }, { jobId: postId, attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 1000, removeOnFail: 5000 });
    return { postId, status: "PROCESSING" };
  },

  async get(authorId: string, postId: string) {
    const post = await postRepository.findById(postId);
    if (!post || post.authorId !== authorId) throw new AppError(404, "Post not found", "POST_NOT_FOUND");
    return withMediaUrls(post);
  },

  async list(authorId: string, page: number, limit: number) {
    const posts = await postRepository.listOwned(authorId, (page - 1) * limit, limit);
    const hasMore = posts.length > limit;
    return {
      posts: await Promise.all(posts.slice(0, limit).map(withMediaUrls)),
      page,
      limit,
      hasMore
    };
  }
};

async function withMediaUrls<T extends { variants: Array<{ objectKey: string; kind: string }> }>(post: T) {
  return {
    ...post,
    variants: await Promise.all(post.variants.map(async (variant) => ({
      ...variant,
      url: await downloadUrl(variant.objectKey)
    })))
  };
}
