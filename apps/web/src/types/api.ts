export type User = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  email?: string;
  isPrivate?: boolean;
};
export type SuggestedUser = User & { following: boolean };
export type FollowList = { users: User[]; page: number; limit: number; total: number; hasMore: boolean };

export type Session = { accessToken: string; user: User };

export type PostVariant = {
  kind: "ORIGINAL" | "WEB" | "THUMBNAIL" | "VIDEO_720P";
  mimeType: string;
  url: string;
};

export type Post = {
  id: string;
  caption: string | null;
  status: "AWAITING_UPLOAD" | "PROCESSING" | "PUBLISHED" | "FAILED";
  mediaType: "IMAGE" | "VIDEO" | "MIXED";
  createdAt: string;
  failureReason: string | null;
  variants: PostVariant[];
  assets?: Array<{ position: number; mediaType: "IMAGE" | "VIDEO"; videoMuted?: boolean; variants: PostVariant[] }>;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  videoStartMs?: number | null;
  videoEndMs?: number | null;
  videoCoverMs?: number | null;
  videoMuted?: boolean;
};

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: User;
  likesCount: number;
  repliesCount: number;
  likedByMe: boolean;
  replies: Comment[];
};

export type CreatePostInput = {
  mediaType: "IMAGE" | "VIDEO";
  mimeType?: string;
  size?: number;
  images?: Array<{ mimeType: string; size: number }>;
  media?: Array<{
    mediaType: "IMAGE" | "VIDEO";
    mimeType: string;
    size: number;
    videoStartMs?: number;
    videoEndMs?: number;
    videoCoverMs?: number;
    videoMuted?: boolean;
  }>;
  caption?: string;
  visibility?: "PUBLIC" | "PRIVATE";
  likesVisible?: boolean;
  videoStartMs?: number;
  videoEndMs?: number;
  videoCoverMs?: number;
  videoMuted?: boolean;
};

export type UploadInstructions = {
  postId: string;
  uploads: Array<{ position: number; uploadUrl: string; uploadHeaders: Record<string, string> }>;
};
