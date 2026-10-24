import { useState } from "react";
import type { Post } from "../../types/api";
import { PostCard } from "../profile/PostCard";
import { PostComposer } from "./PostComposer";
import { SuggestedUsers } from "./SuggestedUsers";

export function HomePage({ token, posts, onPostsChanged, composerOpen, onComposerChange }: { token: string; posts: Post[]; onPostsChanged: () => Promise<void>; composerOpen: boolean; onComposerChange: (open: boolean) => void }) {
  return <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-16"><div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"><section><div className="mb-4"><h2 className="text-lg font-semibold text-white">Your posts</h2></div>{posts.length ? <div className="flex flex-col gap-4">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div> : <div className="grid min-h-64 w-full place-items-center rounded-2xl border border-dashed border-white/10 text-sm text-zinc-600">You have no posts yet.</div>}</section><SuggestedUsers token={token} /></div>{composerOpen && <PostComposer token={token} onClose={() => onComposerChange(false)} onPublished={onPostsChanged} />}</div>;
}
