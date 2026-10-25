import { request } from "./client";
import type { FollowList, SuggestedUser } from "../types/api";

export const followsApi = {
  latestUsers: (token: string) => request<SuggestedUser[]>("/users/discover/latest", {}, token),
  follow: (token: string, username: string) => request<{ following: boolean }>(`/users/${username}/follow`, { method: "POST" }, token),
  unfollow: (token: string, username: string) => request<{ following: boolean }>(`/users/${username}/follow`, { method: "DELETE" }, token),
  followers: (token: string, username: string) => request<FollowList>(`/users/${username}/followers?page=1&limit=50`, {}, token),
  following: (token: string, username: string) => request<FollowList>(`/users/${username}/following?page=1&limit=50`, {}, token),
  removeFollower: (token: string, username: string, followerUsername: string) =>
    request<{ removed: boolean }>(`/users/${username}/followers/${followerUsername}`, { method: "DELETE" }, token)
};
