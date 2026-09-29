import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Activity,
  ArrowLeftRight,
  Boxes,
  ClipboardCheck,
  LogOut,
  Moon,
  Sun,
  Users,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useBase } from "../../hooks/useBase";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: Activity, permission: "/dashboard" },
  { to: "/purchases", label: "Purchases", icon: Boxes, permission: "/purchases" },
  { to: "/transfers", label: "Transfers", icon: ArrowLeftRight, permission: "/transfers" },
  {
    to: "/assign-expend",
    label: "Assign / Expend",
    icon: ClipboardCheck,
    permission: "/assign-expend",
  },
];
function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 48 54" className="size-10 shrink-0 text-amber-500" aria-hidden="true">
        <path d="M24 2 45 10v15c0 13-9 22-21 27C12 47 3 38 3 25V10L24 2Z" fill="currentColor" />
        <path
          d="m24 11 3.5 8h8.7l-6.9 5.2 2.6 8.3-7.9-5-7.9 5 2.6-8.3-6.9-5.2h8.7L24 11Z"
          fill="#1f2a1a"
        />
      </svg>
      {!compact && (
        <div>
          <div className="font-display text-2xl font-bold leading-none tracking-[.14em] text-white">
            MAMS
          </div>
          <div className="mt-1 font-display text-xs font-semibold uppercase tracking-[.22em] text-amber-400">
            Asset Command
          </div>
        </div>
      )}
    </div>
  );
}
export default function MamsLayout() {
  const { currentUser, logout } = useAuth();
  const { bases, basesLoading, basesError, reloadBases, selectedBase, setSelectedBase } = useBase();
  const [dark, setDark] = useState(() => localStorage.getItem("mams_theme") === "dark");
  const allowed = useMemo(
    () =>
      links.filter(
        (link) =>
          (currentUser && ["ADMIN", "BASE_COMMANDER"].includes(currentUser.role)) ||
          link.permission === "/dashboard" ||
          (currentUser?.role === "LOGISTICS_OFFICER" &&
            ["/purchases", "/transfers"].includes(link.permission)),
      ),
    [currentUser],
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("mams_theme", dark ? "dark" : "light");
  }, [dark]);
  const isAdmin = currentUser?.role === "ADMIN";
  const baseValue = selectedBase || currentUser?.base?.id || "";
  const roleLabel = currentUser?.role || "LOGISTICS_OFFICER";
  return (
    <div className="min-h-dvh bg-paper font-sans text-slate-900 transition-colors dark:bg-dark-950 dark:text-stone-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[14.375rem] flex-col overflow-hidden bg-olive-950 text-white shadow-xl md:flex">
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-[.08]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="sidebar-stripes"
              width="18"
              height="18"
              patternTransform="rotate(45)"
              patternUnits="userSpaceOnUse"
            >
              <path d="M0 0v18" stroke="white" strokeWidth="5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sidebar-stripes)" />
        </svg>
        <div className="relative border-b border-white/10 px-5 py-6">
          <Logo />
        </div>
        <nav className="relative flex-1 space-y-1 px-3 py-6">
          {allowed.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex min-h-12 items-center gap-3 rounded-lg px-3 font-display text-base font-bold uppercase tracking-[.12em] transition duration-200 ${isActive ? "bg-amber-500 text-olive-950 shadow-sm" : "text-stone-200 hover:bg-white/10 hover:text-white"}`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
          {isAdmin && (
            <div className="pt-5">
              <p className="px-3 pb-2 font-display text-xs font-bold uppercase tracking-[.2em] text-stone-500">
                Management
              </p>
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `group flex min-h-12 items-center gap-3 rounded-lg px-3 font-display text-base font-bold uppercase tracking-[.12em] transition duration-200 ${isActive ? "bg-amber-500 text-olive-950 shadow-sm" : "text-stone-200 hover:bg-white/10 hover:text-white"}`
                }
              >
                <Users size={19} /> Users
              </NavLink>
            </div>
          )}
        </nav>
        <div className="relative border-t border-white/10 p-4">
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-white/5 p-3">
            <span className="grid size-9 place-items-center rounded-full bg-olive-700 text-amber-300">
              <UserRound size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{currentUser?.name}</p>
              <select
                aria-label="Authenticated role; managed by an administrator"
                disabled
                value={roleLabel}
                className="mt-1 w-full appearance-none truncate bg-transparent text-[11px] uppercase tracking-wider text-stone-400 disabled:cursor-not-allowed"
              >
                <option value="ADMIN">Admin</option>
                <option value="BASE_COMMANDER">Base Commander</option>
                <option value="LOGISTICS_OFFICER">Logistics Officer</option>
              </select>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-stone-300 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>
      <div className="md:pl-[14.375rem]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-dark-900/95 sm:px-6 md:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="md:hidden">
              <Logo compact />
            </div>
            <div className="hidden text-sm font-medium text-slate-500 dark:text-stone-400 md:block">
              Military Asset Management System <span className="px-2 text-amber-600">/</span>{" "}
              <span className="font-semibold text-olive-950 dark:text-stone-100">Operations</span>
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <label className="flex h-10 max-w-44 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 dark:border-stone-700 dark:bg-dark-950 dark:text-stone-300">
                <span className="hidden sm:inline">BASE</span>
                <select
                  aria-label="Selected base"
                  value={baseValue}
                  disabled={!isAdmin}
                  onChange={(e) => setSelectedBase(e.target.value)}
                  className="min-w-0 bg-transparent text-sm outline-none disabled:cursor-not-allowed"
                >
                  <option value="">All bases</option>
                  {bases.map((base) => (
                    <option key={base._id} value={base._id}>
                      {base.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => setDark(!dark)}
                className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-paper dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                aria-label={dark ? "Use light mode" : "Use dark mode"}
              >
                {dark ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <button
                onClick={logout}
                className="grid size-10 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-danger-700 dark:text-stone-400 dark:hover:bg-red-950/40"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 dark:border-stone-800 dark:bg-dark-900 md:hidden">
          {allowed.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 font-display text-sm font-bold uppercase tracking-wider ${isActive ? "bg-amber-500 text-olive-950" : "text-slate-600 dark:text-stone-300"}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 font-display text-sm font-bold uppercase tracking-wider ${isActive ? "bg-amber-500 text-olive-950" : "text-slate-600 dark:text-stone-300"}`
              }
            >
              <Users size={16} /> Users
            </NavLink>
          )}
        </nav>
        {!basesLoading && (basesError || bases.length === 0) && (
          <div
            role={basesError ? "alert" : "status"}
            className="mx-3 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 sm:mx-6 lg:mx-8"
          >
            <span>
              {basesError
                ? `Could not load base list: ${basesError}`
                : "No active bases are configured. Run npm run seed:demo from Backend to add the sample bases and equipment."}
            </span>
            <button
              type="button"
              onClick={reloadBases}
              className="shrink-0 font-display font-bold uppercase tracking-wider underline"
            >
              {basesError ? "Retry" : "Refresh bases"}
            </button>
          </div>
        )}
        <main className="mx-auto min-h-[calc(100dvh-8rem)] w-full max-w-[1600px] px-3 pb-10 pt-5 [padding-bottom:calc(2.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-7 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
