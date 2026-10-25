import { AppError } from "../../shared/errors/app-error.js";
import { downloadUrl } from "../../shared/media-storage.js";
import { followRepository } from "./follow.repository.js";

async function targetUser(username: string) {
  const user = await followRepository.findActiveUserByUsername(username);
  if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
  return user;
}

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

export const followService = {
  async latestUsers(userId: string) {
    const users = await followRepository.listLatestUsers(userId);
    return Promise.all(users.map(async ({ followers, ...user }) => ({
      ...(await withAvatarUrl(user)),
      following: followers.length > 0
    })));
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

  async removeFollower(ownerId: string, profileUsername: string, followerUsername: string) {
    const owner = await targetUser(profileUsername);
    if (owner.id !== ownerId) throw new AppError(403, "You can only manage your own followers", "FOLLOWER_MANAGEMENT_FORBIDDEN");
    const follower = await targetUser(followerUsername);
    await followRepository.removeFollower(follower.id, ownerId);
    return { removed: true, username: follower.username };
  },

  async status(followerId: string, username: string) {
    const target = await targetUser(username);
    const follow = followerId === target.id ? null : await followRepository.findFollow(followerId, target.id);
    return { following: Boolean(follow), username: target.username };
  },

  async listFollowers(username: string, page: number, limit: number) {
    const target = await targetUser(username);
    const [rows, total] = await Promise.all([
      followRepository.listFollowers(target.id, (page - 1) * limit, limit),
      followRepository.countFollowers(target.id)
    ]);
    const hasMore = rows.length > limit;
    const users = await Promise.all(rows.slice(0, limit).map((row) => withAvatarUrl(row.follower)));
    return { users, page, limit, total, hasMore };
  },

  async listFollowing(username: string, page: number, limit: number) {
    const target = await targetUser(username);
    const [rows, total] = await Promise.all([
      followRepository.listFollowing(target.id, (page - 1) * limit, limit),
      followRepository.countFollowing(target.id)
    ]);
    const hasMore = rows.length > limit;
    const users = await Promise.all(rows.slice(0, limit).map((row) => withAvatarUrl(row.following)));
    return { users, page, limit, total, hasMore };
  }
};
