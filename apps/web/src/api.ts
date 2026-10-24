const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

type ApiResponse<T> = { data: T };

export type User = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
};

export type Session = { accessToken: string; user: User };
export type PostVariant = { kind: "ORIGINAL" | "WEB" | "THUMBNAIL" | "VIDEO_720P"; mimeType: string; url: string };
export type Post = { id: string; caption: string | null; status: "AWAITING_UPLOAD" | "PROCESSING" | "PUBLISHED" | "FAILED"; mediaType: "IMAGE" | "VIDEO"; createdAt: string; failureReason: string | null; variants: PostVariant[] };

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...options.headers }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message ?? "Something went wrong");
  return (body as ApiResponse<T>).data;
}

export const api = {
  login: (identifier: string, password: string) => request<Session>("/auth/login", { method: "POST", body: JSON.stringify({ identifier, password }) }),
  register: (input: { email: string; username: string; password: string; displayName: string }) => request<Session>("/auth/register", { method: "POST", body: JSON.stringify(input) }),
  me: (token: string) => request<User>("/auth/me", {}, token),
  createPost: (token: string, input: { mediaType: "IMAGE" | "VIDEO"; mimeType: string; size: number; caption?: string }) => request<{ postId: string; uploadUrl: string; uploadHeaders: Record<string, string> }>("/posts", { method: "POST", body: JSON.stringify(input) }, token),
  completePost: (token: string, postId: string) => request<{ status: string }>(`/posts/${postId}/complete`, { method: "POST" }, token)
  , listPosts: (token: string) => request<{ posts: Post[]; page: number; limit: number; hasMore: boolean }>("/posts?page=1&limit=50", {}, token)
};

export async function uploadToStorage(url: string, file: File, headers: Record<string, string>) {
  const response = await fetch(url, { method: "PUT", headers, body: file });
  if (!response.ok) throw new Error("Media upload failed");
}
