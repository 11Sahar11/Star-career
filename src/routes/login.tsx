import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient, signIn, signOut } from "@/lib/auth/client";
import { deleteMyAccount, getViewerAccess, type ViewerAccess } from "@/lib/access";
import { loadLang, t, type Lang } from "@/game/i18n";
import { Crest } from "@/components/game/crest";

export const Route = createFileRoute("/login")({ component: LoginPage });

type Mode = "signup" | "signin";

function LoginPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<ViewerAccess | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const tr = (key: string, vars?: Record<string, string | number>) => t(key, vars, lang);

  useEffect(() => {
    const chosen = loadLang();
    setLang(chosen);
    document.documentElement.lang = chosen;
    document.documentElement.dir = chosen === "he" ? "rtl" : "ltr";
    refresh();
  }, []);

  function refresh() {
    getViewerAccess()
      .then(setAccess)
      .catch(() => setAccess({ signedIn: false, email: null, verified: false, admin: false }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(tr("acct.shortPass"));
      return;
    }
    setBusy(true);
    try {
      const result =
        mode === "signup"
          ? await authClient.signUp.email({ email: email.trim(), password, name: name.trim() || email.trim().split("@")[0] })
          : await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) {
        setError(result.error.message || tr("acct.failed"));
        return;
      }
      window.location.href = "/";
    } catch {
      setError(tr("acct.failed"));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    try {
      await signIn("grok-google", { callbackURL: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("acct.failed"));
    }
  }

  return (
    <main className="app-shell mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-5">
      <Link to="/" className="mb-4 flex min-h-11 items-center text-sm text-muted">
        {tr("back")}
      </Link>

      <div className="flex items-center gap-2">
        <Crest className="h-8 w-8" />
        <span className="wordmark">STAR</span>
      </div>

      {deleted ? (
        <p role="status" className="card mt-6 px-4 py-4 text-sm">
          {tr("acct.deleted")}
        </p>
      ) : null}

      {access?.signedIn ? (
        <section className="card mt-6 grid gap-3 px-4 py-5">
          <p className="text-xs text-muted">{tr("acct.signedInAs")}</p>
          <p className="truncate text-lg font-semibold" dir="ltr">
            {access.email}
          </p>
          {access.admin ? <span className="chip chip-accent">{tr("acct.admin")}</span> : null}
          {!access.verified ? <p className="text-xs leading-5 text-muted">{tr("acct.unverified")}</p> : null}
          <Link to="/" className="btn-primary flex h-12 items-center justify-center">
            {tr("acct.toGame")}
          </Link>
          <button
            type="button"
            className="btn-ghost h-12"
            onClick={async () => {
              await signOut();
              refresh();
            }}
          >
            {tr("acct.signOut")}
          </button>
          {confirmDelete ? (
            <div className="grid gap-2 border-t border-line pt-3">
              <p className="text-sm">{tr("acct.deleteAsk")}</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn-ghost h-11" onClick={() => setConfirmDelete(false)}>
                  {tr("cancel")}
                </button>
                <button
                  type="button"
                  className="btn-danger h-11"
                  onClick={async () => {
                    try {
                      const result = await deleteMyAccount();
                      if (result.deleted) {
                        await signOut();
                        setDeleted(true);
                        refresh();
                      } else setError(tr("acct.failed"));
                    } catch {
                      setError(tr("acct.failed"));
                    }
                  }}
                >
                  {tr("acct.deleteYes")}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="min-h-11 text-start text-sm text-bad" onClick={() => setConfirmDelete(true)}>
              {tr("acct.delete")}
            </button>
          )}
          {error ? (
            <p role="alert" className="text-sm text-bad">
              {error}
            </p>
          ) : null}
        </section>
      ) : (
        <>
          <h1 className="mt-5 text-2xl font-bold">{mode === "signup" ? tr("acct.signupTitle") : tr("acct.signinTitle")}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{tr("acct.copy")}</p>

          <button type="button" className="btn-ghost mt-5 flex h-12 items-center justify-center gap-2" onClick={google}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
              <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1-3.8 1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.4-.4-2s.1-1.4.4-2V7.2H2.1a11 11 0 0 0 0 9.6z" />
              <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.2L5.7 10C6.6 7.4 9.1 5.4 12 5.4z" />
            </svg>
            {tr("acct.google")}
          </button>

          <div className="my-4 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            {tr("acct.or")}
            <span className="h-px flex-1 bg-line" />
          </div>

          <form className="grid gap-3" onSubmit={submit} noValidate>
            {mode === "signup" ? (
              <label className="grid gap-1.5 text-sm font-semibold" htmlFor="acct-name">
                {tr("acct.name")}
                <input
                  id="acct-name"
                  value={name}
                  maxLength={32}
                  autoComplete="nickname"
                  onChange={(event) => setName(event.target.value)}
                  className="h-12 rounded-md border border-line bg-surface px-4 text-base font-normal text-fg"
                />
              </label>
            ) : null}
            <label className="grid gap-1.5 text-sm font-semibold" htmlFor="acct-email">
              {tr("acct.email")}
              <input
                id="acct-email"
                type="email"
                dir="ltr"
                required
                value={email}
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-md border border-line bg-surface px-4 text-base font-normal text-fg"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold" htmlFor="acct-pass">
              {tr("acct.password")}
              <input
                id="acct-pass"
                type="password"
                dir="ltr"
                required
                minLength={8}
                value={password}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-md border border-line bg-surface px-4 text-base font-normal text-fg"
              />
            </label>
            {error ? (
              <p role="alert" className="text-sm text-bad">
                {error}
              </p>
            ) : null}
            <button type="submit" className="btn-primary mt-1 h-13 text-base" disabled={busy || !email.trim() || !password}>
              {mode === "signup" ? tr("acct.signupBtn") : tr("acct.signinBtn")}
            </button>
          </form>

          <button
            type="button"
            className="mt-4 min-h-11 text-sm text-accent"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError(null);
            }}
          >
            {mode === "signup" ? tr("acct.haveOne") : tr("acct.needOne")}
          </button>
        </>
      )}
    </main>
  );
}
