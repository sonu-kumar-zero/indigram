import { request } from "./client";
import type { Session, User } from "../types/api";

export const authApi = {
  login: (identifier: string, password: string) => request<Session>("/auth/login", { method: "POST", body: JSON.stringify({ identifier, password }) }),
  register: (input: { email: string; username: string; password: string; displayName: string }) => request<Session>("/auth/register", { method: "POST", body: JSON.stringify(input) }),
  me: (token: string) => request<User>("/auth/me", {}, token)
  ,updateProfile: (token: string, input: Partial<Pick<User, "displayName" | "bio" | "avatarUrl" | "isPrivate">> & { avatarSourceKey?: string | null }) => request<User>("/auth/me", { method: "PATCH", body: JSON.stringify(input) }, token),
  avatarUpload: (token: string, input: { mimeType: string; size: number }) => request<{ uploadUrl: string; uploadHeaders: Record<string, string>; sourceKey: string }>("/auth/me/avatar-upload", { method: "POST", body: JSON.stringify(input) }, token)
};
