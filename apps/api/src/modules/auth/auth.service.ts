import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@indigram/database";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import { authRepository } from "./auth.repository.js";
import { randomUUID } from "node:crypto";
import { uploadUrl, downloadUrl } from "../../shared/media-storage.js";
import { mediaQueue } from "../../shared/media-queue.js";

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");
const randomToken = (): string => randomBytes(32).toString("base64url");
const safeUser = async (user: { id: string; email: string; username: string; displayName: string; bio: string | null; avatarUrl: string | null; isPrivate: boolean; emailVerifiedAt: Date | null; createdAt: Date }) => ({
  id: user.id, email: user.email, username: user.username, displayName: user.displayName,
  bio: user.bio, avatarUrl: user.avatarUrl ? (user.avatarUrl.startsWith("http") || user.avatarUrl.startsWith("data:") ? user.avatarUrl : await downloadUrl(user.avatarUrl)) : null, isPrivate: user.isPrivate, emailVerified: Boolean(user.emailVerifiedAt), createdAt: user.createdAt
});

type ClientInfo = { userAgent?: string; ipAddress?: string };

async function issueSession(userId: string, client: ClientInfo) {
  const refreshToken = randomToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 86_400_000);
  const session = await authRepository.createSession({
    userId, refreshTokenHash: hashToken(refreshToken), expiresAt,
    ...(client.userAgent ? { userAgent: client.userAgent } : {}),
    ...(client.ipAddress ? { ipAddress: client.ipAddress } : {})
  });
  const accessToken = jwt.sign({ sid: session.id }, env.ACCESS_TOKEN_SECRET, { subject: userId, expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"] });
  return { accessToken, refreshToken, expiresAt };
}

export const authService = {
  async register(input: { email: string; username: string; password: string; displayName: string }, client: ClientInfo) {
    if (await authRepository.findUserByEmail(input.email)) throw new AppError(409, "Email is already registered", "EMAIL_TAKEN");
    if (await authRepository.findUserByUsername(input.username)) throw new AppError(409, "Username is already taken", "USERNAME_TAKEN");
    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
    let user;
    try {
      user = await authRepository.createUser({ email: input.email, username: input.username, passwordHash, displayName: input.displayName });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        throw new AppError(409, "Email or username is already taken", "ACCOUNT_CONFLICT");
      }
      throw error;
    }
    await this.createVerificationToken(user.id);
    return { user: await safeUser(user), ...(await issueSession(user.id, client)) };
  },

  async login(input: { identifier: string; password: string }, client: ClientInfo) {
    const user = await authRepository.findUserByIdentifier(input.identifier);
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");
    }
    if (user.status !== "ACTIVE") throw new AppError(403, "This account is not active", "ACCOUNT_INACTIVE");
    return { user: await safeUser(user), ...(await issueSession(user.id, client)) };
  },

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const session = await authRepository.findSessionByRefreshHash(tokenHash);
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") {
      throw new AppError(401, "Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
    }
    const nextToken = randomToken();
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 86_400_000);
    const changed = await prisma.session.updateMany({
      where: { id: session.id, refreshTokenHash: tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { refreshTokenHash: hashToken(nextToken), expiresAt, lastUsedAt: new Date() }
    });
    if (changed.count !== 1) throw new AppError(401, "Refresh token has already been used", "REFRESH_TOKEN_REUSED");
    const accessToken = jwt.sign({ sid: session.id }, env.ACCESS_TOKEN_SECRET, { subject: session.userId, expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"] });
    return { accessToken, refreshToken: nextToken, expiresAt };
  },

  async logout(sessionId: string, userId: string) {
    await prisma.session.updateMany({ where: { id: sessionId, userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true };
  },

  async logoutAll(userId: string) {
    const result = await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true, revokedSessions: result.count };
  },

  async me(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
    return await safeUser(user);
  },

  async avatarUpload(userId: string, input: { mimeType: string; size: number }) {
    const extension = input.mimeType.split("/")[1]?.split("+")[0] ?? "bin";
    const sourceKey = `profile-avatars/${userId}/source.${extension}`;
    return { uploadUrl: await uploadUrl(sourceKey, input.mimeType), uploadHeaders: { "content-type": input.mimeType }, sourceKey };
  },

  async updateProfile(userId: string, input: { email?: string; username?: string; displayName?: string; bio?: string | null; avatarUrl?: string | null; avatarSourceKey?: string | null; isPrivate?: boolean }) {
    if (input.avatarSourceKey && !input.avatarSourceKey.startsWith(`profile-avatars/${userId}/`)) {
      throw new AppError(400, "Invalid avatar upload", "INVALID_AVATAR_UPLOAD");
    }
    if (input.username && await authRepository.findUserByUsername(input.username)) throw new AppError(409, "Username is already taken", "USERNAME_TAKEN");
    if (input.email) {
      const existing = await authRepository.findUserByEmail(input.email);
      if (existing && existing.id !== userId) throw new AppError(409, "Email is already in use", "EMAIL_TAKEN");
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: { ...input, ...(input.avatarSourceKey ? { avatarUrl: null } : {}) }
    });
    if (input.avatarSourceKey) {
      await mediaQueue.add("process-profile-avatar", { userId, sourceKey: input.avatarSourceKey }, { jobId: `profile-avatar-${userId}`, removeOnComplete: 1000, removeOnFail: 1000 });
    }
    return await safeUser(user);
  },

  async createVerificationToken(userId: string) {
    const token = randomToken();
    await prisma.emailVerificationToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
    });
  },

  async verifyEmail(token: string) {
    const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.usedAt || record.expiresAt <= new Date()) throw new AppError(400, "Invalid or expired verification token", "INVALID_VERIFICATION_TOKEN");
    await prisma.$transaction([
      prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } })
    ]);
    return { success: true };
  },

  async resendVerification(email: string) {
    const user = await authRepository.findUserByEmail(email);
    if (user && !user.emailVerifiedAt && user.status === "ACTIVE") await this.createVerificationToken(user.id);
    return { message: "If the account requires verification, instructions will be sent." };
  },

  async forgotPassword(email: string) {
    const user = await authRepository.findUserByEmail(email);
    if (user && user.status === "ACTIVE") {
      const token = randomToken();
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
      });
    }
    return { message: "If an account exists for that email, password reset instructions will be sent." };
  },

  async resetPassword(token: string, newPassword: string) {
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.usedAt || record.expiresAt <= new Date()) throw new AppError(400, "Invalid or expired reset token", "INVALID_RESET_TOKEN");
    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await prisma.$transaction([
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash, passwordChangedAt: new Date() } }),
      prisma.session.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } })
    ]);
    return { success: true };
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await authRepository.findUserById(userId);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new AppError(400, "Current password is incorrect", "INCORRECT_CURRENT_PASSWORD");
    }
    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { passwordHash, passwordChangedAt: new Date() } }),
      prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })
    ]);
    return { success: true, message: "Password changed. Please log in again." };
  },

  async sessions(userId: string) {
    return prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, lastUsedAt: true, expiresAt: true },
      orderBy: { lastUsedAt: "desc" }
    });
  },

  async revokeSession(userId: string, sessionId: string) {
    const result = await prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    if (result.count === 0) throw new AppError(404, "Session not found", "SESSION_NOT_FOUND");
    return { success: true };
  },

  async usernameAvailability(username: string) {
    const normalized = username.toLowerCase();
    const available = !(await authRepository.findUserByUsername(normalized));
    return { username: normalized, available };
  }
};
