import { X } from "lucide-react";
export default function Modal({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-olive-950/70 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-fade-up max-h-[92dvh] w-full ${wide ? "max-w-5xl" : "max-w-xl"} overflow-y-auto rounded-2xl border border-slate-200 bg-paper p-5 shadow-2xl dark:border-stone-700 dark:bg-dark-900 sm:p-7`}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[.2em] text-amber-600">
              MAMS / RECORD
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-wide text-olive-950 dark:text-stone-100">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500 dark:text-stone-400">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-stone-300 dark:hover:bg-stone-800"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
