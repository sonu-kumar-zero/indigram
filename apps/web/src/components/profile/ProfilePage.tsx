import type { Post, User } from "../../types/api";
import { Avatar } from "../Brand";
import { Spinner } from "../ui/Feedback";
import { PostCard } from "./PostCard";

export function ProfilePage({
  user,
  token,
  posts,
  loading,
  error,
  onRefresh,
}: {
  user: User;
  token: string;
  posts: Post[];
  loading: boolean;
  error: string;
  onRefresh: () => Promise<void>;
}) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-16">
      <section className="flex flex-wrap items-center gap-5 rounded-2xl border border-white/8 bg-linear-to-br from-[#211c26] to-white/2 p-6 sm:p-8">
        <Avatar user={user} size="lg" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ff9675]">
            Your profile
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {user.displayName}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            @{user.username}
            {user.bio ? ` · ${user.bio}` : ""}
          </p>
        </div>
        <button
          onClick={() => void onRefresh()}
          disabled={loading}
          className="ml-auto flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-[#ff9675]/40 hover:text-white disabled:opacity-50"
        >
          {loading && <Spinner />}
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </section>
      <div className="mb-5 mt-12 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Your uploads{" "}
            <span className="ml-1 text-sm font-normal text-zinc-600">
              ({posts.length})
            </span>
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Your private collection of shared moments.
          </p>
        </div>
      </div>
      {error && (
        <p className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
          {error}
        </p>
      )}
      {loading && !posts.length ? (
        <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-zinc-500">
          <Spinner />
          Loading uploads…
        </div>
      ) : posts.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} user={user} token={token} />
          ))}
        </div>
      ) : (
        <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-white/10 text-sm text-zinc-600">
          Your uploads will appear here.
        </div>
      )}
    </div>
  );
}
