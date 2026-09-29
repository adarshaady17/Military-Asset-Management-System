export default function SectionCard({ title, subtitle, action, children, className = "" }) {
  return (
    <section
      className={`animate-fade-up rounded-xl border border-slate-200 border-t-[3px] border-t-amber-600 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:border-t-amber-600 dark:bg-dark-900 sm:p-6 ${className}`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold uppercase tracking-wider text-olive-950 dark:text-stone-100">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-stone-400">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
