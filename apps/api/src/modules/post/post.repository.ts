import { prisma } from "@indigram/database";

export const postRepository = {
  create(data: { authorId: string; caption?: string; mediaType: "IMAGE" | "VIDEO"; sourceKey: string; sourceMimeType: string; sourceSize: number }) {
    return prisma.post.create({ data });
  },
  findOwned(postId: string, authorId: string) {
    return prisma.post.findFirst({ where: { id: postId, authorId } });
  },
  markProcessing(postId: string, authorId: string) {
    return prisma.post.updateMany({ where: { id: postId, authorId, status: "AWAITING_UPLOAD" }, data: { status: "PROCESSING" } });
  },
  findById(postId: string) {
    return prisma.post.findUnique({ where: { id: postId }, include: { variants: true } });
  }
};
