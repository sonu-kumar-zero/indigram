import { useEffect, useState } from "react";
import { api, uploadToStorage, type Post, type User } from "./api";

type AuthMode = "login" | "register";

export function App() {
  const [token, setToken] = useState(() => localStorage.getItem("indigram_access_token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;
    api.me(token).then(setUser).catch(() => { localStorage.removeItem("indigram_access_token"); setToken(null); }).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <main className="center"><span className="loader" />Loading your space…</main>;
  if (!token || !user) return <AuthScreen onAuthenticated={(nextToken, nextUser) => { localStorage.setItem("indigram_access_token", nextToken); setToken(nextToken); setUser(nextUser); }} />;
  return <Dashboard token={token} user={user} onLogout={() => { localStorage.removeItem("indigram_access_token"); setToken(null); setUser(null); }} />;
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (token: string, user: User) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState({ identifier: "", email: "", username: "", displayName: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const session = mode === "login"
        ? await api.login(form.identifier, form.password)
        : await api.register({ email: form.email, username: form.username, displayName: form.displayName, password: form.password });
      onAuthenticated(session.accessToken, session.user);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to continue"); } finally { setBusy(false); }
  }

  return <main className="auth-layout"><section className="brand-panel"><div className="logo">in<span>di</span>gram</div><p>Share the moments that feel like you.</p><div className="orb orb-one" /><div className="orb orb-two" /></section><section className="auth-card"><div className="eyebrow">WELCOME TO INDIGRAM</div><h1>{mode === "login" ? "Your world, in focus." : "Find your people."}</h1><p className="muted">{mode === "login" ? "Sign in to continue to your feed." : "Create an account and start sharing."}</p><form onSubmit={submit}>{mode === "register" && <><label>Display name<input required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></label><label>Username<input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label><label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label></>}{mode === "login" && <label>Email or username<input required value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} /></label>}<label>Password<input required type="password" minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>{error && <div className="error">{error}</div>}<button disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button></form><button className="switch" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button></section></main>;
}

function Dashboard({ token, user, onLogout }: { token: string; user: User; onLogout: () => void }) {
  const [view, setView] = useState<"home" | "profile">("home");
  const [posts, setPosts] = useState<Post[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");

  async function loadPosts() {
    setPostsLoading(true); setPostsError("");
    try { setPosts((await api.listPosts(token)).posts); } catch (caught) { setPostsError(caught instanceof Error ? caught.message : "Unable to load posts"); } finally { setPostsLoading(false); }
  }

  useEffect(() => { void loadPosts(); }, [token]);
  async function publish(event: React.FormEvent) {
    event.preventDefault(); if (!file) return;
    setBusy(true); setMessage("");
    try {
      const mediaType = file.type.startsWith("video/") ? "VIDEO" : "IMAGE";
      const post = await api.createPost(token, { mediaType, mimeType: file.type, size: file.size, caption: caption || undefined });
      await uploadToStorage(post.uploadUrl, file, post.uploadHeaders);
      await api.completePost(token, post.postId);
      await loadPosts();
      setFile(null); setCaption(""); setMessage("Your post is processing. It will appear once the media variants are ready.");
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Unable to publish"); } finally { setBusy(false); }
  }
  return <main className="app-shell"><header><div className="logo small">in<span>di</span>gram</div><nav><button className={view === "home" ? "nav-button active" : "nav-button"} onClick={() => setView("home")}>Home</button><button className={view === "profile" ? "nav-button active" : "nav-button"} onClick={() => setView("profile")}>Profile</button></nav><div className="profile"><div className="avatar">{user.displayName[0]}</div><span>@{user.username}</span><button className="text-button" onClick={onLogout}>Log out</button></div></header>{view === "profile" ? <ProfileView user={user} posts={posts} loading={postsLoading} error={postsError} onRefresh={loadPosts} /> : <div className="content"><section className="welcome"><div><div className="eyebrow">YOUR CREATIVE SPACE</div><h1>Good to see you, {user.displayName.split(" ")[0]}.</h1><p className="muted">Turn a moment into something worth remembering.</p></div><div className="spark">✦</div></section><section className="composer"><div className="section-title"><span>Create a post</span><small>Images up to 10 MB · Videos up to 250 MB</small></div><form onSubmit={publish}><label className="dropzone">{file ? <><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(1)} MB · Ready to upload</span></> : <><strong>Drop an image or video here</strong><span>or click to browse your device</span></>}<input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label><textarea placeholder="Write a caption…" maxLength={2200} value={caption} onChange={(e) => setCaption(e.target.value)} />{message && <div className={message.startsWith("Your") ? "success" : "error"}>{message}</div>}<button disabled={!file || busy}>{busy ? "Uploading…" : "Share post"}</button></form></section></div>}</main>;
}

function ProfileView({ user, posts, loading, error, onRefresh }: { user: User; posts: Post[]; loading: boolean; error: string; onRefresh: () => Promise<void> }) {
  return <div className="content profile-page"><section className="profile-hero"><div className="profile-avatar">{user.displayName[0]}</div><div><div className="eyebrow">YOUR PROFILE</div><h1>{user.displayName}</h1><p className="muted">@{user.username}{user.bio ? ` · ${user.bio}` : ""}</p></div><button className="refresh-button" onClick={() => void onRefresh()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button></section><div className="section-title posts-heading"><span>Your uploads <small>({posts.length})</small></span><small>Only you can see this view</small></div>{error && <div className="error">{error}</div>}{loading && !posts.length ? <div className="empty-state"><span className="loader" />Loading your uploads…</div> : posts.length === 0 ? <div className="empty-state">You have not uploaded anything yet.</div> : <div className="post-grid">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div>}</div>;
}

function PostCard({ post }: { post: Post }) {
  const preview = post.variants.find((variant) => variant.kind === "THUMBNAIL") ?? post.variants.find((variant) => variant.kind === "WEB") ?? post.variants.find((variant) => variant.kind === "ORIGINAL");
  return <article className="post-card">{post.status === "PUBLISHED" && preview ? post.mediaType === "VIDEO" ? <video controls poster={preview.kind === "THUMBNAIL" ? preview.url : undefined} src={post.variants.find((variant) => variant.kind === "VIDEO_720P")?.url ?? post.variants.find((variant) => variant.kind === "ORIGINAL")?.url} /> : <img src={preview.url} alt={post.caption ?? "Uploaded post"} /> : <div className={`post-placeholder ${post.status.toLowerCase()}`}><strong>{post.status === "FAILED" ? "Processing failed" : post.status === "AWAITING_UPLOAD" ? "Upload pending" : "Processing media…"}</strong>{post.failureReason && <span>{post.failureReason}</span>}</div>}<div className="post-meta"><span>{post.caption || "No caption"}</span><time>{new Date(post.createdAt).toLocaleDateString()}</time></div></article>;
}
