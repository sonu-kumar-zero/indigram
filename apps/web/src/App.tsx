import { useEffect, useState } from "react";
import { authApi } from "./api";
import type { User } from "./types/api";
import { AuthPage } from "./components/auth/AuthPage";
import { AppShell } from "./components/layout/AppShell";

export function App() {
  const [token, setToken] = useState(() => localStorage.getItem("indigram_access_token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;
    authApi.me(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("indigram_access_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#0b0b0f] text-sm text-zinc-400">Loading your space…</main>;
  }

  if (!token || !user) {
    return <AuthPage onAuthenticated={(nextToken, nextUser) => {
      localStorage.setItem("indigram_access_token", nextToken);
      setToken(nextToken);
      setUser(nextUser);
    }} />;
  }

  return <AppShell token={token} user={user} onUserChange={setUser} onLogout={() => {
    localStorage.removeItem("indigram_access_token");
    setToken(null);
    setUser(null);
  }} />;
}
