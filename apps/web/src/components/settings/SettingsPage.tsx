import { useState } from "react";
import { authApi } from "../../api/auth";
import { uploadToStorage } from "../../api/client";
import type { User } from "../../types/api";
import { Avatar } from "../Brand";
import { Spinner } from "../ui/Feedback";

type ProfileForm = { displayName: string; bio: string; avatarUrl: string; avatarSourceKey?: string | null };

export function SettingsPage({ token, user, onUserChange }: { token: string; user: User; onUserChange: (user: User) => void }) {
  const [section, setSection] = useState<"menu" | "edit" | "visibility">("menu");
  const [form, setForm] = useState<ProfileForm>({ displayName: user.displayName, bio: user.bio ?? "", avatarUrl: user.avatarUrl ?? "" });
  const [privateAccount, setPrivateAccount] = useState(user.isPrivate ?? false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(input: Parameters<typeof authApi.updateProfile>[1]) {
    setBusy(true); setMessage("");
    try {
      const updated = await authApi.updateProfile(token, input);
      onUserChange(updated);
      setMessage("Changes saved.");
    }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save changes."); }
    finally { setBusy(false); }
  }
  if (section === "menu") return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
      <h1 className="text-2xl font-semibold text-white">Settings</h1>
      <p className="mt-2 text-sm text-zinc-500">Manage your account and how people see you.</p>
      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <button onClick={() => setSection("edit")} className="flex w-full items-center gap-4 border-b border-white/10 p-5 text-left hover:bg-white/[0.04]">
        <Avatar user={user} /><span className="flex-1"><strong className="block text-sm text-white">Account edit</strong><span className="mt-1 block text-xs text-zinc-500">Display name, bio, and profile photo</span></span><span className="text-xl text-zinc-600">›</span>
        </button>
        <button onClick={() => setSection("visibility")} className="flex w-full items-center gap-4 p-5 text-left hover:bg-white/[0.04]">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ff9675]/10 text-[#ff9675]">◉</span><span className="flex-1"><strong className="block text-sm text-white">Account visibility</strong><span className="mt-1 block text-xs text-zinc-500">{privateAccount ? "Private account" : "Public account"}</span></span><span className="text-xl text-zinc-600">›</span>
        </button>
      </div>
    </div>
  );
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
      <button onClick={() => setSection("menu")} className="text-sm text-zinc-500 hover:text-white">‹ Settings</button>
      <h1 className="mt-6 text-2xl font-semibold text-white">{section === "edit" ? "Edit account" : "Account visibility"}</h1>
      {section === "edit" ? (
        <div className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-4 border-b border-white/10 pb-5"><Avatar user={{ ...user, avatarUrl: form.avatarUrl || null }} size="lg" /><label className="cursor-pointer text-sm font-medium text-[#ff9675]">Change profile photo<input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; void (async () => { try { const upload = await authApi.avatarUpload(token, { mimeType: file.type, size: file.size }); await uploadToStorage(upload.uploadUrl, file, upload.uploadHeaders); setMessage("Photo uploaded. Save changes to process it."); setForm((value) => ({ ...value, avatarUrl: URL.createObjectURL(file), avatarSourceKey: upload.sourceKey } as typeof value & { avatarSourceKey: string })); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to upload photo."); } })(); }} /></label><button type="button" onClick={() => setForm((value) => ({ ...value, avatarUrl: "", avatarSourceKey: null } as typeof value & { avatarSourceKey: string | null }))} className="text-xs text-zinc-500 hover:text-rose-300">Remove</button></div>
          <label className="block text-sm text-zinc-400">Name<input value={form.displayName} onChange={(event) => setForm((value) => ({ ...value, displayName: event.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff9675]/50" /></label>
          <label className="block text-sm text-zinc-400">Bio<textarea value={form.bio} onChange={(event) => setForm((value) => ({ ...value, bio: event.target.value }))} maxLength={160} className="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff9675]/50" /></label>
          <button disabled={busy} onClick={() => void save({ displayName: form.displayName, bio: form.bio || null, ...(form.avatarSourceKey ? { avatarSourceKey: form.avatarSourceKey } : { avatarUrl: form.avatarUrl || null }) })} className="flex items-center gap-2 rounded-xl bg-[#ff9675] px-4 py-2.5 text-sm font-semibold text-[#291719] disabled:opacity-50">{busy && <Spinner />} Save changes</button>
        </div>
      ) : <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5"><label className="flex items-center justify-between gap-4"><span><strong className="block text-sm text-white">Private account</strong><span className="mt-1 block text-xs text-zinc-500">Only approved people can see your profile and posts.</span></span><input type="checkbox" checked={privateAccount} onChange={(event) => { setPrivateAccount(event.target.checked); void save({ isPrivate: event.target.checked }); }} className="h-5 w-5 accent-[#ff9675]" /></label></div>}
      {message && <p className="mt-4 text-sm text-zinc-400">{message}</p>}
    </div>
  );
}
