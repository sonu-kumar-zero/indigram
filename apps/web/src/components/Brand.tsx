export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={
        compact
          ? "text-xl font-black tracking-[-0.08em] text-white"
          : "text-5xl font-black tracking-[-0.08em] text-white sm:text-7xl"
      }
    >
      indi<span className="text-[#ff8c69]">gram</span>
    </span>
  );
}

export function Avatar({
  user,
  size = "sm",
}: {
  user: { displayName: string; avatarUrl: string | null };
  size?: "sm" | "lg";
}) {
  return user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt=""
      className={`${size === "lg" ? "h-24 w-24" : "h-9 w-9"} rounded-full object-cover ring-4 ring-white/10`}
    />
  ) : (
    <span
      className={`grid ${size === "lg" ? "h-24 w-24 text-3xl" : "h-9 w-9 text-sm"} place-items-center rounded-full bg-linear-to-br from-[#ffb08e] to-[#d86666] font-bold text-[#291719] ring-4 ring-white/5`}
    >
      {user.displayName.slice(0, 1).toUpperCase()}
    </span>
  );
}
