import { z } from "zod";

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const username = z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, and underscores only").transform((value) => value.toLowerCase());
const password = z.string().min(10).max(128);

export const registerSchema = z.object({
  email,
  username,
  password,
  displayName: z.string().trim().min(1).max(80)
});
export const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(128)
});
export const refreshSchema = z.object({ refreshToken: z.string().min(20) });
export const tokenSchema = z.object({ token: z.string().min(20) });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({ token: z.string().min(20), newPassword: password });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: password });
export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(160).nullable().optional(),
  avatarUrl: z.string().url().max(2048).nullable().optional()
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");
