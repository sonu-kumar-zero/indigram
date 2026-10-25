import { useEffect, type ReactNode } from "react";

export function OverlayMenu({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="overlay-menu-title"
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#17171e] p-5 shadow-2xl shadow-black/50"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="overlay-menu-title" className="font-medium text-zinc-100">{title}</h2>
          <button onClick={onClose} aria-label="Close menu" className="rounded-lg px-2 py-1 text-xl text-zinc-500 hover:bg-white/10 hover:text-white">×</button>
        </div>
        <div className="mt-4 space-y-2">{children}</div>
      </div>
    </div>
  );
}
