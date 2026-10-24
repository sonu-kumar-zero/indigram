import { request } from "./client";
import type { Session, User } from "../types/api";

export const authApi = {
  login: (identifier: string, password: string) => request<Session>("/auth/login", { method: "POST", body: JSON.stringify({ identifier, password }) }),
  register: (input: { email: string; username: string; password: string; displayName: string }) => request<Session>("/auth/register", { method: "POST", body: JSON.stringify(input) }),
  me: (token: string) => request<User>("/auth/me", {}, token)
};
