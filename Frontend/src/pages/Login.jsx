import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, Star } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Field, TextInput } from "../components/common/Field";
function Crest() {
  return (
    <div className="grid size-14 place-items-center rounded-2xl bg-amber-500 text-olive-950 shadow-lg">
      <ShieldCheck size={28} />
      <Star size={10} className="absolute translate-y-1 fill-current" />
    </div>
  );
}
export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      if (!remember) localStorage.removeItem("fieldops_token");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Sign in could not be completed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="grid min-h-dvh bg-paper dark:bg-dark-950 lg:grid-cols-[minmax(24rem,.9fr)_1.1fr]">
      <section className="relative flex min-h-[18rem] flex-col justify-between overflow-hidden bg-olive-950 p-6 text-white sm:p-10 lg:min-h-dvh lg:p-14">
        <svg
          className="pointer-events-none absolute -right-28 -top-20 size-[34rem] text-white/10"
          viewBox="0 0 400 400"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="200" cy="200" r="45" stroke="currentColor" />
          <circle cx="200" cy="200" r="95" stroke="currentColor" />
          <circle cx="200" cy="200" r="145" stroke="currentColor" />
          <circle cx="200" cy="200" r="195" stroke="currentColor" />
          <path d="M5 200h390M200 5v390" stroke="currentColor" />
        </svg>
        <div className="relative flex items-center gap-4">
          <Crest />
          <div>
            <p className="font-display text-3xl font-bold tracking-[.16em]">MAMS</p>
            <p className="font-display text-sm font-semibold uppercase tracking-[.22em] text-amber-400">
              Asset Command
            </p>
          </div>
        </div>
        <div className="relative my-9 max-w-lg">
          <p className="mb-4 font-display text-xs font-bold uppercase tracking-[.24em] text-amber-400">
            Military Asset Management System
          </p>
          <h1 className="font-display text-4xl font-bold uppercase leading-[.98] tracking-wide sm:text-5xl">
            Readiness begins
            <br />
            with visibility.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-stone-300 sm:text-base">
            A secure workspace for commanders and logistics personnel to manage inventory and
            movement across authorized bases.
          </p>
        </div>
        <p className="relative text-xs font-medium uppercase tracking-[.18em] text-stone-400">
          Authorized personnel only <span className="mx-2 text-amber-500">•</span> Secure operations
        </p>
      </section>
      <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-14">
        <div className="w-full max-w-lg animate-fade-up rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-olive-950/5 sm:p-10 dark:border-stone-800 dark:bg-dark-900">
          <div className="mb-8">
            <div className="mb-6 lg:hidden">
              <Crest />
            </div>
            <p className="font-display text-xs font-bold uppercase tracking-[.2em] text-amber-600">
              Secure sign-in
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold text-olive-950 dark:text-stone-100">
              Welcome back
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-stone-400">
              Sign in to manage assets, movements, and operations across your authorized bases.
            </p>
          </div>
          <form onSubmit={submit} className="grid gap-5">
            <Field label="Official email">
              <TextInput
                id="login-email"
                name="email"
                autoComplete="username"
                autoFocus
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@unit.mil"
              />
            </Field>
            <Field label="Password">
              <span className="relative block">
                <TextInput
                  id="login-password"
                  name="password"
                  className="pr-12"
                  autoComplete="current-password"
                  required
                  type={visible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 dark:text-stone-400 dark:hover:bg-stone-800"
                  aria-label={visible ? "Hide password" : "Show password"}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-stone-300">
              <input
                id="remember-device"
                name="rememberDevice"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-4 accent-amber-600"
              />
              Keep me signed in on this device
            </label>
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-danger-700 dark:border-red-900 dark:bg-red-950/30"
              >
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className="mt-1 flex h-12 items-center justify-center gap-2 rounded-lg bg-amber-600 font-display text-lg font-bold uppercase tracking-[.14em] text-olive-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-amber-500 hover:shadow-md disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? "Authenticating…" : "Sign in to MAMS"}
            </button>
          </form>
          <div className="mt-8 border-t border-slate-100 pt-5 text-center text-xs text-slate-400 dark:border-stone-800 dark:text-stone-500">
            User accounts are provisioned by an administrator.
          </div>
        </div>
      </section>
    </main>
  );
}
