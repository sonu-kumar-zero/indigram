import { request } from "./client";
import type { Comment } from "../types/api";

export const engagementApi = {
  likePost: (token: string, postId: string) => request<{ liked: boolean }>(`/posts/${postId}/like`, { method: "POST" }, token),
  unlikePost: (token: string, postId: string) => request<{ liked: boolean }>(`/posts/${postId}/like`, { method: "DELETE" }, token),
  listComments: (token: string, postId: string) => request<{ comments: Comment[]; page: number; limit: number; hasMore: boolean }>(`/posts/${postId}/comments?page=1&limit=50`, {}, token),
  createComment: (token: string, postId: string, content: string, parentId?: string) => request<Comment>(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ content, ...(parentId ? { parentId } : {}) }) }, token),
  likeComment: (token: string, commentId: string) => request<{ liked: boolean }>(`/comments/${commentId}/like`, { method: "POST" }, token),
  unlikeComment: (token: string, commentId: string) => request<{ liked: boolean }>(`/comments/${commentId}/like`, { method: "DELETE" }, token),
  deleteComment: (token: string, commentId: string) => request<{ deleted: boolean }>(`/comments/${commentId}`, { method: "DELETE" }, token)
};
