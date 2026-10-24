import { request } from "./client";
import type { SuggestedUser } from "../types/api";

export const followsApi = {
  latestUsers: (token: string) => request<SuggestedUser[]>("/users/discover/latest", {}, token),
  follow: (token: string, username: string) => request<{ following: boolean }>(`/users/${username}/follow`, { method: "POST" }, token),
  unfollow: (token: string, username: string) => request<{ following: boolean }>(`/users/${username}/follow`, { method: "DELETE" }, token)
};
