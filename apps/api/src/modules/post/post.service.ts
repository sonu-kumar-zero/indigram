import { randomUUID } from "node:crypto";
import { AppError } from "../../shared/errors/app-error.js";
import { mediaQueue } from "../../shared/media-queue.js";
import { downloadUrl, uploadUrl } from "../../shared/media-storage.js";
import { postRepository } from "./post.repository.js";

export const postService = {
  async create(authorId: string, input: { mediaType: "IMAGE" | "VIDEO"; mimeType?: string; size?: number; images?: Array<{ mimeType: string; size: number }>; media?: Array<{ mediaType: "IMAGE" | "VIDEO"; mimeType: string; size: number; videoStartMs?: number; videoEndMs?: number; videoCoverMs?: number; videoMuted?: boolean }>; caption?: string; visibility?: "PUBLIC" | "PRIVATE"; likesVisible?: boolean; videoStartMs?: number; videoEndMs?: number; videoCoverMs?: number; videoMuted?: boolean }) {
    const postId = randomUUID();
    const media = input.media ?? (input.images ? input.images.map((image) => ({ ...image, mediaType: "IMAGE" as const, videoStartMs: undefined, videoEndMs: undefined, videoCoverMs: undefined, videoMuted: undefined })) : [{ mediaType: input.mediaType, mimeType: input.mimeType!, size: input.size!, videoStartMs: input.videoStartMs, videoEndMs: input.videoEndMs, videoCoverMs: input.videoCoverMs, videoMuted: input.videoMuted }]);
    const uploads = await Promise.all(media.map(async (image, position) => {
      const extension = image.mimeType.split("/")[1]?.split("+")[0] ?? "bin";
      const sourceKey = `originals/${authorId}/${postId}/${position}.${extension}`;
      return { position, sourceKey, sourceMimeType: image.mimeType, sourceSize: image.size, uploadUrl: await uploadUrl(sourceKey, image.mimeType), uploadMethod: "PUT", uploadHeaders: { "content-type": image.mimeType }, expiresIn: 900 };
    }));
    const first = uploads[0]!;
    const postMediaType = new Set(media.map((item) => item.mediaType)).size > 1 ? "MIXED" : media[0]!.mediaType;
    const post = await postRepository.create({ authorId, mediaType: postMediaType, sourceKey: first.sourceKey, sourceMimeType: first.sourceMimeType, sourceSize: first.sourceSize, visibility: input.visibility, likesVisible: input.likesVisible, assets: uploads.map(({ position, sourceKey, sourceMimeType, sourceSize }, index) => {
      const item = media[index]!;
      return { position, sourceKey, sourceMimeType, sourceSize, mediaType: item.mediaType, videoStartMs: item.videoStartMs, videoEndMs: item.videoEndMs, videoCoverMs: item.videoCoverMs, videoMuted: item.videoMuted };
    }), ...(input.caption ? { caption: input.caption } : {}) });
    return { postId: post.id, status: post.status, uploads };
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
    const post = await postRepository.findById(postId, authorId);
    if (!post || post.authorId !== authorId) throw new AppError(404, "Post not found", "POST_NOT_FOUND");
    return withMediaUrls(post);
  },

  async list(authorId: string, page: number, limit: number) {
    const posts = await postRepository.listOwned(authorId, authorId, (page - 1) * limit, limit);
    const hasMore = posts.length > limit;
    return {
      posts: await Promise.all(posts.slice(0, limit).map(withMediaUrls)),
      page,
      limit,
      hasMore
    };
  }
};

async function withMediaUrls<T extends { variants: Array<{ objectKey: string; kind: string }>; assets: Array<{ variants: Array<{ objectKey: string; kind: string }> }>; _count: { likes: number; comments: number }; likes: Array<unknown> }>(post: T) {
  return {
    ...post,
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
    likedByMe: post.likes.length > 0,
    _count: undefined,
    likes: undefined,
    variants: await Promise.all(post.variants.map(async (variant) => ({
      ...variant,
      url: await downloadUrl(variant.objectKey)
    }))),
    assets: await Promise.all(post.assets.map(async (asset) => ({
      ...asset,
      variants: await Promise.all(asset.variants.map(async (variant) => ({ ...variant, url: await downloadUrl(variant.objectKey) })))
    })))
  };
}
