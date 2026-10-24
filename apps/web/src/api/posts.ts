import { request } from "./client";
import type { CreatePostInput, Post, UploadInstructions } from "../types/api";

export const postsApi = {
  create: (token: string, input: CreatePostInput) => request<UploadInstructions>("/posts", { method: "POST", body: JSON.stringify(input) }, token),
  complete: (token: string, postId: string) => request<{ status: string }>(`/posts/${postId}/complete`, { method: "POST" }, token),
  listMine: (token: string) => request<{ posts: Post[]; page: number; limit: number; hasMore: boolean }>("/posts?page=1&limit=50", {}, token)
};
