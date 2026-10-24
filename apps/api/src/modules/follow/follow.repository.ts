import { prisma } from "@indigram/database";

const publicUserSelect = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  avatarUrl: true
} as const;

export const followRepository = {
  listLatestUsers(userId: string) {
    return prisma.user.findMany({
      where: { id: { not: userId }, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        followers: { where: { followerId: userId }, select: { followerId: true } }
      }
    });
  },
  findActiveUserByUsername(username: string) {
    return prisma.user.findFirst({
      where: { username, status: "ACTIVE" },
      select: { id: true, username: true }
    });
  },

  findFollow(followerId: string, followingId: string) {
    return prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    });
  },

  createFollow(followerId: string, followingId: string) {
    return prisma.follow.create({ data: { followerId, followingId } });
  },

  deleteFollow(followerId: string, followingId: string) {
    return prisma.follow.deleteMany({ where: { followerId, followingId } });
  },

  listFollowers(userId: string, skip: number, take: number) {
    return prisma.follow.findMany({
      where: { followingId: userId, follower: { status: "ACTIVE" } },
      orderBy: [{ createdAt: "desc" }, { followerId: "desc" }],
      skip,
      take: take + 1,
      select: { follower: { select: publicUserSelect } }
    });
  },

  listFollowing(userId: string, skip: number, take: number) {
    return prisma.follow.findMany({
      where: { followerId: userId, following: { status: "ACTIVE" } },
      orderBy: [{ createdAt: "desc" }, { followingId: "desc" }],
      skip,
      take: take + 1,
      select: { following: { select: publicUserSelect } }
    });
  }
};
