import { z } from "zod";

const mediaType = z.enum(["IMAGE", "VIDEO"]);
const mimeType = z.string().regex(/^(image|video)\/[a-z0-9.+-]+$/i);

export const createPostSchema = z.object({
  mediaType,
  mimeType,
  size: z.number().int().positive(),
  caption: z.string().trim().max(2200).optional()
}).superRefine((value, context) => {
  const maxSize = value.mediaType === "IMAGE" ? 10 * 1024 * 1024 : 250 * 1024 * 1024;
  if (value.size > maxSize) context.addIssue({ code: "custom", path: ["size"], message: "Media exceeds the upload limit" });
  if (value.mediaType === "IMAGE" && !value.mimeType.startsWith("image/")) context.addIssue({ code: "custom", path: ["mimeType"], message: "Image posts require an image MIME type" });
  if (value.mediaType === "VIDEO" && !value.mimeType.startsWith("video/")) context.addIssue({ code: "custom", path: ["mimeType"], message: "Video posts require a video MIME type" });
});

export const postIdParamsSchema = z.object({ postId: z.string().min(1) });
