const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

type ApiResponse<T> = { data: T };

export async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message ?? "Something went wrong");
  return (body as ApiResponse<T>).data;
}

export async function uploadToStorage(url: string, file: File, headers: Record<string, string>) {
  const response = await fetch(url, { method: "PUT", headers, body: file });
  if (!response.ok) throw new Error("Media upload failed");
}
