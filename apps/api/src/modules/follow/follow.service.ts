import { AppError } from "../../shared/errors/app-error.js";
import { followRepository } from "./follow.repository.js";

async function targetUser(username: string) {
  const user = await followRepository.findActiveUserByUsername(username);
  if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
  return user;
}

export const followService = {
  async latestUsers(userId: string) {
    const users = await followRepository.listLatestUsers(userId);
    return users.map(({ followers, ...user }) => ({ ...user, following: followers.length > 0 }));
  },
  async follow(followerId: string, username: string) {
    const target = await targetUser(username);
    if (followerId === target.id) {
      throw new AppError(400, "You cannot follow yourself", "SELF_FOLLOW_NOT_ALLOWED");
    }
    await followRepository.createFollow(followerId, target.id).catch((error: unknown) => {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") return;
      throw error;
    });
    return { following: true, username: target.username };
  },

  async unfollow(followerId: string, username: string) {
    const target = await targetUser(username);
    if (followerId === target.id) {
      throw new AppError(400, "You cannot unfollow yourself", "SELF_FOLLOW_NOT_ALLOWED");
    }
    await followRepository.deleteFollow(followerId, target.id);
    return { following: false, username: target.username };
  },

  async status(followerId: string, username: string) {
    const target = await targetUser(username);
    const follow = followerId === target.id ? null : await followRepository.findFollow(followerId, target.id);
    return { following: Boolean(follow), username: target.username };
  },

  async listFollowers(username: string, page: number, limit: number) {
    const target = await targetUser(username);
    const rows = await followRepository.listFollowers(target.id, (page - 1) * limit, limit);
    const hasMore = rows.length > limit;
    return { users: rows.slice(0, limit).map((row) => row.follower), page, limit, hasMore };
  },

  async listFollowing(username: string, page: number, limit: number) {
    const target = await targetUser(username);
    const rows = await followRepository.listFollowing(target.id, (page - 1) * limit, limit);
    const hasMore = rows.length > limit;
    return { users: rows.slice(0, limit).map((row) => row.following), page, limit, hasMore };
  }
};
