import type { Post } from "../../types/api";
import { useState } from "react";

export function PostCard({ post }: { post: Post }) {
  const [active, setActive] = useState(0);
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
  return (
    <article className="mx-auto flex h-[70vh] w-[50vw] max-w-180 min-w-[min(100%,20rem)] flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/[0.035] transition hover:border-white/15">
      {pending ? (
        <div
          className={`grid min-h-0 flex-1 place-items-center gap-2 p-6 text-center ${post.status === "FAILED" ? "bg-rose-950/20" : "bg-white/2"}`}
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
          poster={preview?.kind === "THUMBNAIL" ? preview.url : undefined}
          src={video?.url}
          className="min-h-0 flex-1 bg-black object-contain"
        />
      ) : preview ? (
        <div className="relative min-h-0 flex-1 bg-black">
          <img
            src={preview.url}
            alt={post.caption ?? "Uploaded post"}
            className="h-full w-full object-contain"
          />
          {assets.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActive(
                    (value) => (value - 1 + assets.length) % assets.length,
                  )
                }
                className="absolute left-3 top-1/2 rounded-full bg-black/60 px-3 py-2 text-white"
              >
                ‹
              </button>
              <button
                onClick={() =>
                  setActive((value) => (value + 1) % assets.length)
                }
                className="absolute right-3 top-1/2 rounded-full bg-black/60 px-3 py-2 text-white"
              >
                ›
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {assets.map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 w-1.5 rounded-full ${index === active ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
      <div className="flex shrink-0 items-center justify-between gap-4 p-4">
        <p className="truncate text-sm text-zinc-300">
          {post.caption || "No caption"}
        </p>
        <time className="shrink-0 text-xs text-zinc-600">
          {new Date(post.createdAt).toLocaleDateString()}
        </time>
      </div>
    </article>
  );
}
