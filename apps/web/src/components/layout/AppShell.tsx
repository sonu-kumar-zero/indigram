import { useEffect, useState } from "react";
import type { Post, User } from "../../types/api";
import { postsApi } from "../../api";
import { HomePage } from "../home/HomePage";
import { ProfilePage } from "../profile/ProfilePage";
import { Sidebar } from "./Sidebar";

export type View = "home" | "profile";

export function AppShell({
  token,
  user,
  onLogout,
}: {
  token: string;
  user: User;
  onLogout: () => void;
}) {
  const [view, setView] = useState<View>("home");
  const [composerOpen, setComposerOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState("");

  async function loadPosts() {
    setLoadingPosts(true);
    setPostsError("");
    try {
      setPosts((await postsApi.listMine(token)).posts);
    } catch (caught) {
      setPostsError(
        caught instanceof Error ? caught.message : "Unable to load uploads",
      );
    } finally {
      setLoadingPosts(false);
    }
  }
  useEffect(() => {
    void loadPosts();
  }, [token]);

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-zinc-100">
      <Sidebar
        user={user}
        view={view}
        onNavigate={setView}
        onCreate={() => {
          setView("home");
          setComposerOpen(true);
        }}
        onLogout={onLogout}
      />
      <div className="min-h-screen pl-18">
        {view === "home" ? (
          <HomePage
            token={token}
            posts={posts}
            onPostsChanged={loadPosts}
            composerOpen={composerOpen}
            onComposerChange={setComposerOpen}
          />
        ) : (
          <ProfilePage
            user={user}
            posts={posts}
            loading={loadingPosts}
            error={postsError}
            onRefresh={loadPosts}
          />
        )}
      </div>
    </main>
  );
}
