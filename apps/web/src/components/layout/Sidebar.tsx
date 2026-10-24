import type { ReactNode } from "react";
import type { User } from "../../types/api";
import { Avatar, Brand } from "../Brand";
import type { View } from "./AppShell";

function Icon({ children }: { children: ReactNode }) {
  return <span className="grid h-10 w-10 shrink-0 place-items-center">{children}</span>;
}

function HomeIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg>;
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>;
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14" /></svg>;
}

function LogoutIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" /></svg>;
}

export function Sidebar({ user, view, onNavigate, onCreate, onLogout }: { user: User; view: View; onNavigate: (view: View) => void; onCreate: () => void; onLogout: () => void }) {
  const items = [
    { label: "Home", value: "home" as const, icon: <HomeIcon /> },
    { label: "Profile", value: "profile" as const, icon: <UserIcon /> }
  ];

  return <aside className="group fixed inset-y-0 left-0 z-30 flex w-[4.5rem] flex-col border-r border-white/[0.07] bg-[#101015]/95 px-3 py-5 shadow-2xl shadow-black/20 backdrop-blur-xl transition-[width] duration-300 hover:w-64">
    <button onClick={() => onNavigate("home")} aria-label="Go home" className="flex h-12 items-center overflow-hidden rounded-xl px-1.5 text-left"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ff9675]/10 text-[#ff9675]">✦</span><span className="ml-4 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100"><Brand compact /></span></button>
    <div className="my-8 h-px bg-white/[0.07]" />
    <nav className="space-y-2">{items.map((item) => <NavItem key={item.value} active={view === item.value} label={item.label} icon={item.icon} onClick={() => onNavigate(item.value)} />)}</nav>
    <button onClick={onCreate} className="mt-5 flex h-12 items-center overflow-hidden rounded-xl px-1.5 text-zinc-500 transition hover:bg-[#ff9675]/10 hover:text-[#ffb29b]"><Icon><PlusIcon /></Icon><span className="ml-4 whitespace-nowrap text-sm opacity-0 transition-opacity group-hover:opacity-100">Create post</span></button>
    <div className="mt-auto space-y-3"><button onClick={() => onNavigate("profile")} className="flex w-full items-center overflow-hidden rounded-xl p-1.5 text-left transition hover:bg-white/[0.06]"><span className="shrink-0"><Avatar user={user} /></span><span className="ml-3 min-w-0 whitespace-nowrap text-sm text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100"><span className="block max-w-40 truncate">{user.displayName}</span><span className="text-xs text-zinc-600">@{user.username}</span></span></button><button onClick={onLogout} className="flex h-12 w-full items-center overflow-hidden rounded-xl px-1.5 text-zinc-500 transition hover:bg-rose-400/10 hover:text-rose-300"><Icon><LogoutIcon /></Icon><span className="ml-4 whitespace-nowrap text-sm opacity-0 transition-opacity group-hover:opacity-100">Log out</span></button></div>
  </aside>;
}

function NavItem({ active, label, icon, onClick }: { active: boolean; label: string; icon: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className={`flex h-12 w-full items-center overflow-hidden rounded-xl px-1.5 transition ${active ? "bg-[#ff9675]/10 text-[#ffb29b]" : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"}`}><Icon>{icon}</Icon><span className="ml-4 whitespace-nowrap text-sm opacity-0 transition-opacity group-hover:opacity-100">{label}</span></button>;
}
