import { AppError } from "../../shared/errors/app-error.js";
import { downloadUrl } from "../../shared/media-storage.js";
import { engagementRepository } from "./engagement.repository.js";

async function withAvatarUrl<T extends { avatarUrl: string | null }>(user: T) {
  return {
    ...user,
    avatarUrl: user.avatarUrl
      ? user.avatarUrl.startsWith("http") || user.avatarUrl.startsWith("data:")
        ? user.avatarUrl
        : await downloadUrl(user.avatarUrl)
      : null
  };
}

async function accessiblePost(postId: string, userId: string) {
  const post = await engagementRepository.findPost(postId);
  if (!post || post.status !== "PUBLISHED" || (post.visibility === "PRIVATE" && post.authorId !== userId)) {
    throw new AppError(404, "Post not found", "POST_NOT_FOUND");
  }
  return post;
}

export const engagementService = {
  async likePost(userId: string, postId: string) {
    await accessiblePost(postId, userId);
    await engagementRepository.createPostLike(userId, postId).catch((error: unknown) => {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") return;
      throw error;
    });
    return { liked: true, postId };
  },
  async unlikePost(userId: string, postId: string) {
    await accessiblePost(postId, userId);
    await engagementRepository.deletePostLike(userId, postId);
    return { liked: false, postId };
  },
  async likeComment(userId: string, commentId: string) {
    const comment = await engagementRepository.findComment(commentId);
    if (!comment) throw new AppError(404, "Comment not found", "COMMENT_NOT_FOUND");
    await accessiblePost(comment.postId, userId);
    await engagementRepository.createCommentLike(userId, commentId).catch((error: unknown) => {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") return;
      throw error;
    });
    return { liked: true, commentId };
  },
  async unlikeComment(userId: string, commentId: string) {
    const comment = await engagementRepository.findComment(commentId);
    if (!comment) throw new AppError(404, "Comment not found", "COMMENT_NOT_FOUND");
    await accessiblePost(comment.postId, userId);
    await engagementRepository.deleteCommentLike(userId, commentId);
    return { liked: false, commentId };
  },
  async createComment(userId: string, postId: string, content: string, parentId?: string) {
    await accessiblePost(postId, userId);
    if (parentId) {
      const parent = await engagementRepository.findComment(parentId);
      if (!parent || parent.postId !== postId) throw new AppError(400, "Parent comment does not belong to this post", "INVALID_PARENT_COMMENT");
    }
    const comment = await engagementRepository.createComment(postId, userId, content, parentId);
    return {
      ...comment,
      author: await withAvatarUrl(comment.author),
      likesCount: 0,
      repliesCount: 0,
      likedByMe: false,
      replies: []
    };
  },
  async listComments(userId: string, postId: string, page: number, limit: number) {
    await accessiblePost(postId, userId);
    const rows = await engagementRepository.listComments(postId, userId, (page - 1) * limit, limit);
    const hasMore = rows.length > limit;
    const comments = await Promise.all(rows.slice(0, limit).map(async (comment) => ({
      ...comment,
      author: await withAvatarUrl(comment.author),
      likesCount: comment._count.likes,
      repliesCount: comment._count.replies,
      likedByMe: comment.likes.length > 0,
      _count: undefined,
      likes: undefined,
      replies: await Promise.all(comment.replies.map(async (reply) => ({
        ...reply,
        author: await withAvatarUrl(reply.author),
        likesCount: reply._count.likes,
        repliesCount: reply._count.replies,
        likedByMe: reply.likes.length > 0,
        _count: undefined,
        likes: undefined
      })))
    })));
    return { comments, page, limit, hasMore };
  },
  async deleteComment(userId: string, commentId: string) {
    const comment = await engagementRepository.findComment(commentId);
    if (!comment) throw new AppError(404, "Comment not found", "COMMENT_NOT_FOUND");
    const post = await accessiblePost(comment.postId, userId);
    if (comment.authorId !== userId && post.authorId !== userId) throw new AppError(403, "You cannot delete this comment", "COMMENT_DELETE_FORBIDDEN");
    await engagementRepository.deleteComment(commentId);
    return { deleted: true, commentId };
  }
};
