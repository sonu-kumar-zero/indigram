import { useState } from "react";
import { authApi } from "../../api";
import type { User } from "../../types/api";
import { Brand } from "../Brand";
import { Alert, Spinner } from "../ui/Feedback";

type AuthMode = "login" | "register";

export function AuthPage({
  onAuthenticated,
}: {
  onAuthenticated: (token: string, user: User) => void;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState({
    identifier: "",
    email: "",
    username: "",
    displayName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update =
    (field: keyof typeof form) =>
      (event: React.ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [field]: event.target.value });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const session =
        mode === "login"
          ? await authApi.login(form.identifier, form.password)
          : await authApi.register({
            email: form.email,
            username: form.username,
            displayName: form.displayName,
            password: form.password,
          });
      onAuthenticated(session.accessToken, session.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-zinc-100 lg:grid lg:grid-cols-[1.15fr_0.85fr]">
      <section className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_65%_35%,#473044_0%,#19141d_38%,#0b0b0f_75%)] p-12 lg:flex lg:flex-col lg:justify-between xl:p-20">
        <Brand />
        <div className="relative z-10 max-w-lg pb-12">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#ff9978]">
            A softer way to share
          </p>
          <h1 className="font-serif text-6xl font-bold leading-[0.95] tracking-tight text-white xl:text-8xl">
            Make room for the moments that matter.
          </h1>
          <p className="mt-7 max-w-sm text-lg leading-8 text-zinc-400">
            A visual journal for the things you want to keep close.
          </p>
        </div>
        <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-[#e97f62]/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      </section>
      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Brand />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff9978]">
            Welcome to Indigram
          </p>
          <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-white">
            {mode === "login" ? "Your world, in focus." : "Find your people."}
          </h2>
          <p className="mt-3 text-zinc-400">
            {mode === "login"
              ? "Sign in to continue to your space."
              : "Create an account and start sharing."}
          </p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "register" && (
              <>
                <Field
                  label="Display name"
                  value={form.displayName}
                  onChange={update("displayName")}
                />
                <Field
                  label="Username"
                  value={form.username}
                  onChange={update("username")}
                />
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                />
              </>
            )}
            {mode === "login" && (
              <Field
                label="Email or username"
                value={form.identifier}
                onChange={update("identifier")}
              />
            )}
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={update("password")}
              minLength={10}
            />
            {error && <Alert>{error}</Alert>}
            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff9675] px-5 py-3.5 font-bold text-[#271718] transition hover:bg-[#ffad91] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy && <Spinner />}
              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
          <button
            className="mt-5 w-full text-sm text-zinc-500 transition hover:text-[#ffad91]"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  type = "text",
  minLength,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  minLength?: number;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block text-sm text-zinc-400">
      <span className="mb-2 block">{label}</span>
      <input
        required
        type={type}
        minLength={minLength}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#ff9675]/60 focus:ring-4 focus:ring-[#ff9675]/10"
      />
    </label>
  );
}
