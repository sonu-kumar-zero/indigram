import { prisma } from "@indigram/database";

export const engagementRepository = {
  findPost(postId: string) {
    return prisma.post.findUnique({ where: { id: postId }, select: { id: true, authorId: true, status: true, visibility: true } });
  },
  findComment(commentId: string) {
    return prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, postId: true, authorId: true } });
  },
  findPostLike(userId: string, postId: string) {
    return prisma.postLike.findUnique({ where: { userId_postId: { userId, postId } } });
  },
  createPostLike(userId: string, postId: string) {
    return prisma.postLike.create({ data: { userId, postId } });
  },
  deletePostLike(userId: string, postId: string) {
    return prisma.postLike.deleteMany({ where: { userId, postId } });
  },
  findCommentLike(userId: string, commentId: string) {
    return prisma.commentLike.findUnique({ where: { userId_commentId: { userId, commentId } } });
  },
  createCommentLike(userId: string, commentId: string) {
    return prisma.commentLike.create({ data: { userId, commentId } });
  },
  deleteCommentLike(userId: string, commentId: string) {
    return prisma.commentLike.deleteMany({ where: { userId, commentId } });
  },
  createComment(postId: string, authorId: string, content: string, parentId?: string) {
    return prisma.comment.create({
      data: { postId, authorId, content, ...(parentId ? { parentId } : {}) },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }
    });
  },
  listComments(postId: string, userId: string, skip: number, take: number) {
    return prisma.comment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: "asc" },
      skip,
      take: take + 1,
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        _count: { select: { likes: true, replies: true } },
        likes: { where: { userId }, select: { userId: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            _count: { select: { likes: true, replies: true } },
            likes: { where: { userId }, select: { userId: true } }
          }
        }
      }
    });
  },
  deleteComment(commentId: string) {
    return prisma.comment.delete({ where: { id: commentId } });
  }
};
