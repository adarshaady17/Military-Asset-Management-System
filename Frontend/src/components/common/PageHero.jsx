import { useBase } from "../../hooks/useBase";
import { useAuth } from "../../hooks/useAuth";
export default function PageHero({ title, description }) {
  const { bases, selectedBase } = useBase();
  const { currentUser } = useAuth();
  const baseId = selectedBase || currentUser?.base?.id;
  const base = bases.find((item) => item._id === baseId);
  const role = currentUser?.role?.replaceAll("_", " ") || "AUTHORIZED USER";
  return (
    <section className="relative isolate mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-olive-950 via-olive-800 to-[#64733d] px-6 py-7 text-white shadow-sm sm:px-8 sm:py-8">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-24 -z-10 h-[23rem] w-[23rem] animate-radar text-white/20 sm:-right-2 sm:-top-32 sm:h-[30rem] sm:w-[30rem]"
        viewBox="0 0 400 400"
        fill="none"
      >
        <circle cx="200" cy="200" r="48" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="96" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="144" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="192" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 200h384M200 8v384" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="5" fill="currentColor" />
      </svg>
      <p className="mb-2 font-display text-xs font-bold uppercase tracking-[.24em] text-amber-300">
        MAMS / ASSET COMMAND
      </p>
      <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-[.08em] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-white/80 sm:text-base">{description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-white/70">
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
          {base?.name ||
            (currentUser?.role === "ADMIN" ? "All bases" : currentUser?.base?.name) ||
            "Assigned base"}
        </span>
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">{role}</span>
        <span className="font-mono normal-case tracking-normal">
          {new Date().toISOString().slice(0, 10)}
        </span>
      </div>
    </section>
  );
}
