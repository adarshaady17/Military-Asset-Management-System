export function Field({ label, children, hint, error, className = "" }) {
  return (
    <label
      className={`grid gap-2 text-sm font-medium text-slate-700 dark:text-stone-200 ${className}`}
    >
      <span>{label}</span>
      {children}
      {hint && <small className="font-normal text-slate-500 dark:text-stone-400">{hint}</small>}
      {error && <small className="font-medium text-danger-700">{error}</small>}
    </label>
  );
}
export const inputClass =
  "h-12 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-stone-700 dark:bg-dark-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:disabled:bg-dark-950";
export function TextInput({ className = "", ...props }) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}
export function SelectInput({ className = "", children, ...props }) {
  return (
    <select className={`${inputClass} ${className}`} {...props}>
      {children}
    </select>
  );
}
