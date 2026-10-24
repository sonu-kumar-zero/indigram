import { prisma } from "@indigram/database";

export const postRepository = {
  create(data: { authorId: string; caption?: string; mediaType: "IMAGE" | "VIDEO"; sourceKey: string; sourceMimeType: string; sourceSize: number; visibility?: "PUBLIC" | "PRIVATE"; likesVisible?: boolean; assets?: Array<{ position: number; sourceKey: string; sourceMimeType: string; sourceSize: number }> }) {
    return prisma.post.create({ data: { ...data, assets: data.assets ? { create: data.assets } : undefined } });
  },
  findOwned(postId: string, authorId: string) {
    return prisma.post.findFirst({ where: { id: postId, authorId } });
  },
  markProcessing(postId: string, authorId: string) {
    return prisma.post.updateMany({ where: { id: postId, authorId, status: "AWAITING_UPLOAD" }, data: { status: "PROCESSING" } });
  },
  findById(postId: string) {
    return prisma.post.findUnique({ where: { id: postId }, include: { variants: true, assets: { include: { variants: true }, orderBy: { position: "asc" } } } });
  },
  listOwned(authorId: string, skip: number, take: number) {
    return prisma.post.findMany({
      where: { authorId },
      orderBy: { createdAt: "desc" },
      skip,
      take: take + 1,
      include: { variants: true, assets: { include: { variants: true }, orderBy: { position: "asc" } } }
    });
  }
};
