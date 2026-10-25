import { z } from "zod";

export const postIdParamsSchema = z.object({ postId: z.string().min(1) });
export const commentIdParamsSchema = z.object({ commentId: z.string().min(1) });
export const commentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});
export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(2200),
  parentId: z.string().min(1).optional()
});
