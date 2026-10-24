export function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#ff9675]" />;
}

export function Alert({ children, tone = "error" }: { children: React.ReactNode; tone?: "error" | "success" }) {
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tone === "success" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-rose-400/20 bg-rose-400/10 text-rose-200"}`}>{children}</div>;
}
