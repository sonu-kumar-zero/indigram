import type { Comment, Post, User } from "../../types/api";
import { useEffect, useRef, useState } from "react";
import { engagementApi } from "../../api";
import { Avatar } from "../Brand";
import { OverlayMenu } from "../ui/OverlayMenu";

export function PostCard({ post, user, token }: { post: Post; user: User; token: string }) {
  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string>();
  const [commentsError, setCommentsError] = useState("");
  const [busy, setBusy] = useState(false);
  const mediaScroller = useRef<HTMLDivElement>(null);
  const assets = post.assets ?? [];
  const asset = assets[active];
  const assetVariants = asset?.variants ?? post.variants;
  const preview =
    assetVariants.find((variant) => variant.kind === "WEB") ??
    assetVariants.find((variant) => variant.kind === "THUMBNAIL") ??
    assetVariants.find((variant) => variant.kind === "ORIGINAL");
  const video =
    assetVariants.find((variant) => variant.kind === "VIDEO_720P") ??
    assetVariants.find((variant) => variant.kind === "ORIGINAL");
  const pending = post.status !== "PUBLISHED";
  useEffect(() => {
    setLiked(post.likedByMe);
    setLikesCount(post.likesCount);
  }, [post.likedByMe, post.likesCount]);
  async function toggleLike() {
    setBusy(true);
    try {
      if (liked) {
        await engagementApi.unlikePost(token, post.id);
      } else {
        await engagementApi.likePost(token, post.id);
      }
      setLiked((value) => !value);
      setLikesCount((value) => value + (liked ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }
  async function loadComments() {
    try {
      const result = await engagementApi.listComments(token, post.id);
      setComments(result.comments);
      setCommentsError("");
    } catch (caught) {
      setCommentsError(caught instanceof Error ? caught.message : "Unable to load comments");
    }
  }
  async function submitComment() {
    if (!commentText.trim()) return;
    setBusy(true);
    try {
      const created = await engagementApi.createComment(token, post.id, commentText.trim(), replyTo);
      const normalized = { ...created, replies: created.replies ?? [], likesCount: created.likesCount ?? 0, repliesCount: created.repliesCount ?? 0, likedByMe: created.likedByMe ?? false };
      if (replyTo) {
        setComments((items) => items.map((comment) => comment.id === replyTo ? { ...comment, replies: [...(comment.replies ?? []), normalized], repliesCount: comment.repliesCount + 1 } : comment));
      } else {
        setComments((items) => [...items, normalized]);
      }
      setCommentText("");
      setReplyTo(undefined);
    } catch (caught) {
      setCommentsError(caught instanceof Error ? caught.message : "Unable to add comment");
    } finally {
      setBusy(false);
    }
  }
  async function toggleCommentLike(comment: Comment) {
    const method = comment.likedByMe ? engagementApi.unlikeComment : engagementApi.likeComment;
    await method(token, comment.id);
    const update = (item: Comment): Comment => item.id === comment.id ? { ...item, likedByMe: !item.likedByMe, likesCount: item.likesCount + (item.likedByMe ? -1 : 1) } : { ...item, replies: (item.replies ?? []).map(update) };
    setComments((items) => items.map(update));
  }
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: post.caption ?? "Indigram post", url });
    else await navigator.clipboard.writeText(url);
  };
  function scrollMedia(direction: number) {
    const scroller = mediaScroller.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * scroller.clientWidth, behavior: "smooth" });
  }
  return (
    <article className="mx-auto flex w-full min-w-0 max-w-180 flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/[0.035] transition hover:border-white/15">
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar user={user} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-200">{user.displayName}</p>
            <p className="truncate text-xs text-zinc-600">@{user.username}</p>
          </div>
        </div>
        <button onClick={() => setMenuOpen(true)} aria-label="Open post menu" className="rounded-lg px-2 py-1 text-xl leading-none text-zinc-500 hover:bg-white/10 hover:text-white">⋯</button>
      </header>
      {pending ? (
        <div
          className={`grid min-h-64 place-items-center gap-2 p-6 text-center ${post.status === "FAILED" ? "bg-rose-950/20" : "bg-white/2"}`}
        >
          <span className="text-sm font-medium text-zinc-300">
            {post.status === "FAILED"
              ? "Processing failed"
              : post.status === "AWAITING_UPLOAD"
                ? "Upload pending"
                : "Preparing your media…"}
          </span>
          {post.failureReason && (
            <span className="wrap-break-word text-xs text-rose-300">
              {post.failureReason}
            </span>
          )}
        </div>
      ) : post.mediaType === "VIDEO" ? (
        <video
          controls
          muted={post.videoMuted ?? false}
          poster={preview?.kind === "THUMBNAIL" ? preview.url : undefined}
          src={video?.url}
          className="block h-auto w-full bg-black"
        />
      ) : assets.length > 0 ? (
        <div className="relative w-full bg-black">
          <div
            ref={mediaScroller}
            onScroll={(event) => {
              const scroller = event.currentTarget;
              setActive(Math.round(scroller.scrollLeft / scroller.clientWidth));
            }}
            className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
          >
            {assets.map((item, index) => {
              const itemPreview =
                item.variants.find((variant) => variant.kind === "WEB") ??
                item.variants.find((variant) => variant.kind === "THUMBNAIL") ??
                item.variants.find((variant) => variant.kind === "ORIGINAL");
              const itemVideo =
                item.variants.find((variant) => variant.kind === "VIDEO_720P") ??
                item.variants.find((variant) => variant.kind === "ORIGINAL");
              return (
                <div key={`${item.position}-${index}`} className="w-full shrink-0 snap-center">
                  {(item.mediaType === "VIDEO" || post.mediaType === "VIDEO") ? (
                    <video
                      controls
                      muted={item.videoMuted ?? false}
                      poster={itemPreview?.kind === "THUMBNAIL" ? itemPreview.url : undefined}
                      src={itemVideo?.url}
                      className="block h-auto w-full"
                    />
                  ) : itemPreview ? (
                    <img src={itemPreview.url} alt={post.caption ?? "Uploaded post"} className="block h-auto w-full" />
                  ) : null}
                </div>
              );
            })}
          </div>
          {assets.length > 1 && (
            <>
              <button
                aria-label="Previous media"
                onClick={() => scrollMedia(-1)}
                className="absolute left-3 top-1/2 rounded-full bg-black/60 px-3 py-2 text-white"
              >
                ‹
              </button>
              <button
                aria-label="Next media"
                onClick={() => scrollMedia(1)}
                className="absolute right-3 top-1/2 rounded-full bg-black/60 px-3 py-2 text-white"
              >
                ›
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {assets.map((_, index) => (
                  <button
                    key={index}
                    aria-label={`Show media ${index + 1}`}
                    onClick={() => mediaScroller.current?.scrollTo({ left: index * (mediaScroller.current?.clientWidth ?? 0), behavior: "smooth" })}
                    className={`h-1.5 w-1.5 rounded-full ${index === active ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
      <footer className="shrink-0 border-t border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-4 text-sm">
          <button disabled={busy} onClick={() => void toggleLike()} className={`transition disabled:opacity-50 ${liked ? "text-rose-400" : "text-zinc-400 hover:text-rose-300"}`}>
            {liked ? "♥" : "♡"} <span className="ml-1 text-xs">{likesCount}</span>
          </button>
          <button onClick={() => { setCommentsOpen((value) => !value); if (!commentsOpen) void loadComments(); }} className="text-zinc-400 transition hover:text-[#ffb29b]">◌ <span className="ml-1 text-xs">{post.commentsCount} Comment{post.commentsCount === 1 ? "" : "s"}</span></button>
          <button onClick={() => void share()} className="text-zinc-400 transition hover:text-[#ffb29b]">↗ <span className="ml-1 text-xs">Share</span></button>
          <span className="ml-auto text-xs text-zinc-600">{post.mediaType.toLowerCase()} · {assets.length || 1} item{assets.length === 1 ? "" : "s"}</span>
        </div>
        {post.caption && <p className="mt-2 text-sm text-zinc-300">{post.caption}</p>}
        <time className="mt-2 block text-xs text-zinc-600">{new Date(post.createdAt).toLocaleString()}</time>
      </footer>
      {commentsOpen && (
        <section className="border-t border-white/[0.06] px-4 py-3">
          {commentsError && <p className="mb-3 text-xs text-rose-300">{commentsError}</p>}
          <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} onReply={() => setReplyTo(comment.id)} onLike={() => void toggleCommentLike(comment)} />
            ))}
            {!comments.length && <p className="text-sm text-zinc-600">No comments yet.</p>}
          </div>
          <div className="mt-4 flex gap-2">
            <input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder={replyTo ? "Write a reply…" : "Add a comment…"} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-[#ff9675]/50" />
            <button disabled={busy || !commentText.trim()} onClick={() => void submitComment()} className="rounded-xl bg-[#ff9675] px-3 py-2 text-sm font-medium text-[#291719] disabled:opacity-40">Post</button>
          </div>
          {replyTo && <button onClick={() => setReplyTo(undefined)} className="mt-2 text-xs text-zinc-500 hover:text-zinc-300">Cancel reply</button>}
        </section>
      )}
      <OverlayMenu open={menuOpen} title="Post options" onClose={() => setMenuOpen(false)}>
        <button onClick={() => void share().finally(() => setMenuOpen(false))} className="w-full rounded-xl px-3 py-3 text-left text-sm text-zinc-300 hover:bg-white/8">Share post</button>
        <button onClick={() => setMenuOpen(false)} className="w-full rounded-xl px-3 py-3 text-left text-sm text-zinc-300 hover:bg-white/8">Copy post link</button>
        <button onClick={() => setMenuOpen(false)} className="w-full rounded-xl px-3 py-3 text-left text-sm text-rose-300 hover:bg-rose-400/10">Report post</button>
      </OverlayMenu>
    </article>
  );
}

function CommentItem({ comment, onReply, onLike, nested = false }: { comment: Comment; onReply: () => void; onLike: () => void; nested?: boolean }) {
  return (
    <div className={nested ? "ml-8" : ""}>
      <div className="flex gap-2">
        <Avatar user={comment.author} />
        <div className="min-w-0 flex-1 rounded-xl bg-white/[0.04] px-3 py-2">
          <p className="text-xs font-medium text-zinc-300">@{comment.author.username}</p>
          <p className="mt-1 text-sm text-zinc-400">{comment.content}</p>
          <div className="mt-2 flex gap-3 text-xs text-zinc-600">
            <button onClick={onLike} className={comment.likedByMe ? "text-rose-400" : "hover:text-rose-300"}>{comment.likedByMe ? "♥" : "♡"} {comment.likesCount}</button>
            {!nested && <button onClick={onReply} className="hover:text-zinc-300">Reply</button>}
            <time>{new Date(comment.createdAt).toLocaleDateString()}</time>
          </div>
        </div>
      </div>
      {(comment.replies ?? []).map((reply) => <CommentItem key={reply.id} comment={reply} onReply={onReply} onLike={onLike} nested />)}
    </div>
  );
}
