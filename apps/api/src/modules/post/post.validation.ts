import { z } from "zod";

const mediaType = z.enum(["IMAGE", "VIDEO"]);
const mimeType = z.string().regex(/^(image|video)\/[a-z0-9.+-]+$/i);

export const createPostSchema = z.object({
  mediaType,
  mimeType: mimeType.optional(),
  size: z.number().int().positive().optional(),
  images: z.array(z.object({ mimeType, size: z.number().int().positive() })).min(1).max(10).optional(),
  media: z.array(z.object({
    mediaType,
    mimeType,
    size: z.number().int().positive(),
    videoStartMs: z.number().int().min(0).optional(),
    videoEndMs: z.number().int().positive().optional(),
    videoCoverMs: z.number().int().min(0).optional(),
    videoMuted: z.boolean().default(false)
  })).min(1).max(10).optional(),
  caption: z.string().trim().max(2200).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  likesVisible: z.boolean().default(true),
  videoStartMs: z.number().int().min(0).optional(),
  videoEndMs: z.number().int().positive().optional(),
  videoCoverMs: z.number().int().min(0).optional(),
  videoMuted: z.boolean().default(false)
}).superRefine((value, context) => {
  if (value.media?.length) {
    value.media.forEach((item, index) => {
      const maxSize = item.mediaType === "IMAGE" ? 10 * 1024 * 1024 : 250 * 1024 * 1024;
      if (item.size > maxSize) context.addIssue({ code: "custom", path: ["media", index, "size"], message: "Media exceeds the upload limit" });
      if (!item.mimeType.startsWith(`${item.mediaType.toLowerCase()}/`)) context.addIssue({ code: "custom", path: ["media", index, "mimeType"], message: "Media type does not match MIME type" });
      if (item.mediaType === "IMAGE" && (item.videoStartMs !== undefined || item.videoEndMs !== undefined || item.videoCoverMs !== undefined || item.videoMuted)) {
        context.addIssue({ code: "custom", path: ["media", index], message: "Video edit settings require a video asset" });
      }
      if (item.videoStartMs !== undefined && item.videoEndMs !== undefined && item.videoStartMs >= item.videoEndMs) {
        context.addIssue({ code: "custom", path: ["media", index, "videoEndMs"], message: "Video end time must be after start time" });
      }
    });
    return;
  }
  if (value.mediaType === "IMAGE" && !value.images?.length && (!value.mimeType || !value.size)) {
    context.addIssue({ code: "custom", path: ["images"], message: "At least one image is required" });
  }
  if (value.mediaType === "IMAGE" && value.images) {
    value.images.forEach((image, index) => {
      if (image.size > 10 * 1024 * 1024) context.addIssue({ code: "custom", path: ["images", index, "size"], message: "Image exceeds the upload limit" });
    });
  }
  if (value.mediaType === "IMAGE" && value.images?.some((image) => !image.mimeType.startsWith("image/"))) {
    context.addIssue({ code: "custom", path: ["images"], message: "Image posts require image MIME types" });
  }
  if (value.mediaType === "IMAGE" && value.images?.length) return;
  if (!value.mimeType || !value.size) return;
  const maxSize = value.mediaType === "IMAGE" ? 10 * 1024 * 1024 : 250 * 1024 * 1024;
  if (value.size > maxSize) context.addIssue({ code: "custom", path: ["size"], message: "Media exceeds the upload limit" });
  if (value.mediaType === "IMAGE" && !value.mimeType.startsWith("image/")) context.addIssue({ code: "custom", path: ["mimeType"], message: "Image posts require an image MIME type" });
  if (value.mediaType === "VIDEO" && !value.mimeType.startsWith("video/")) context.addIssue({ code: "custom", path: ["mimeType"], message: "Video posts require a video MIME type" });
  if (value.mediaType === "IMAGE" && (value.videoStartMs !== undefined || value.videoEndMs !== undefined || value.videoCoverMs !== undefined || value.videoMuted === true)) {
    context.addIssue({ code: "custom", path: ["mediaType"], message: "Video edit settings require a video post" });
  }
  if (value.videoStartMs !== undefined && value.videoEndMs !== undefined && value.videoStartMs >= value.videoEndMs) {
    context.addIssue({ code: "custom", path: ["videoEndMs"], message: "Video end time must be after start time" });
  }
});

export const postIdParamsSchema = z.object({ postId: z.string().min(1) });
export const postListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});
