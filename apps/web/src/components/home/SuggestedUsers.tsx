export function SuggestedUsers(_props: { token: string }) {
  return <aside className="p-5 lg:pl-8"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">Discover</p><h2 className="mt-1 font-semibold text-white">People to follow</h2></div><div className="space-y-5" aria-label="People to follow">{Array.from({ length: 2 }, (_, index) => <UserSkeleton key={index} />)}</div></aside>;
}

function UserSkeleton() {
  return <div className="flex animate-pulse items-center gap-3" aria-hidden="true"><div className="h-9 w-9 shrink-0 rounded-full bg-white/10" /><div className="min-w-0 flex-1 space-y-2"><div className="h-3 w-24 rounded-full bg-white/10" /><div className="h-2.5 w-16 rounded-full bg-white/[0.06]" /></div><div className="h-7 w-14 rounded-lg bg-white/[0.08]" /></div>;
}
