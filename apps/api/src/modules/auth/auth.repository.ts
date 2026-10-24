import { prisma } from "@indigram/database";

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  findUserByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  },
  findUserByIdentifier(identifier: string) {
    const normalized = identifier.toLowerCase();
    return prisma.user.findFirst({ where: { OR: [{ email: normalized }, { username: normalized }] } });
  },
  createUser(data: { email: string; username: string; passwordHash: string; displayName: string }) {
    return prisma.user.create({ data });
  },
  findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },
  createSession(data: { userId: string; refreshTokenHash: string; expiresAt: Date; userAgent?: string; ipAddress?: string }) {
    return prisma.session.create({ data });
  },
  findSessionByRefreshHash(refreshTokenHash: string) {
    return prisma.session.findUnique({ where: { refreshTokenHash }, include: { user: true } });
  }
};
