import { useEffect, useState } from "react";
import { followsApi } from "../../api/follows";
import type { SuggestedUser } from "../../types/api";
import { Avatar } from "../Brand";

export function SuggestedUsers({ token }: { token: string }) {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    followsApi.latestUsers(token)
      .then((result) => { if (active) setUsers(result); })
      .catch(() => { if (active) setUsers([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  async function toggle(user: SuggestedUser) {
    setBusy(user.username);
    try {
      const result = user.following
        ? await followsApi.unfollow(token, user.username)
        : await followsApi.follow(token, user.username);
      setUsers((current) => current.map((item) => item.username === user.username ? { ...item, following: result.following } : item));
    } finally {
      setBusy(null);
    }
  }

  return (
    <aside className="p-5 lg:pl-8">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
          Discover
        </p>
        <h2 className="mt-1 font-semibold text-white">People to follow</h2>
      </div>
      <div className="space-y-5" aria-label="People to follow">
        {loading ? Array.from({ length: 2 }, (_, index) => (
          <UserSkeleton key={index} />
        )) : users.length ? users.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <Avatar user={user} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">{user.displayName}</p>
              <p className="truncate text-xs text-zinc-600">@{user.username}</p>
            </div>
            <button
              disabled={busy === user.username}
              onClick={() => void toggle(user)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${user.following ? "border border-white/10 text-zinc-400 hover:border-rose-400/40 hover:text-rose-300" : "bg-[#ff9675] text-[#291719] hover:bg-[#ffb29b]"}`}
            >
              {busy === user.username ? "…" : user.following ? "Following" : "Follow"}
            </button>
          </div>
        )) : (
          <p className="text-sm text-zinc-600">No new people to follow.</p>
        )}
      </div>
    </aside>
  );
}

function UserSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3" aria-hidden="true">
      <div className="h-9 w-9 shrink-0 rounded-full bg-white/10" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-24 rounded-full bg-white/10" />
        <div className="h-2.5 w-16 rounded-full bg-white/6" />
      </div>
      <div className="h-7 w-14 rounded-lg bg-white/8" />
    </div>
  );
}
