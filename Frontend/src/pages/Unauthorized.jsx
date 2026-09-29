import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
export default function Unauthorized() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper p-5 dark:bg-dark-950">
      <section className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-stone-800 dark:bg-dark-900">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-red-50 text-danger-700 dark:bg-red-950/40">
          <ShieldAlert size={25} />
        </div>
        <p className="font-display text-sm font-bold uppercase tracking-[.2em] text-amber-600">
          Access restricted
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase text-olive-950 dark:text-stone-100">
          Unauthorized
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-stone-400">
          Your account does not have permission to access this area.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-olive-950 px-5 font-display font-bold uppercase tracking-wider text-white transition hover:bg-olive-800"
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
