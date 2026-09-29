export default function DataTable({
  columns,
  rows,
  loading,
  empty = "No records found",
  rowKey = "_id",
}) {
  if (loading)
    return (
      <div className="grid min-h-40 place-items-center text-sm text-slate-500 dark:text-stone-400">
        Loading records…
      </div>
    );
  if (!rows?.length)
    return (
      <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-slate-200 px-5 text-center text-sm text-slate-500 dark:border-stone-700 dark:text-stone-400">
        {empty}
      </div>
    );
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-stone-700">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-stone-700">
        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-dark-950 dark:text-stone-400">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
          {rows.map((row, index) => (
            <tr
              key={row[rowKey] || index}
              className="transition hover:bg-amber-50/50 dark:hover:bg-stone-800/40"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="whitespace-nowrap px-4 py-3.5 text-slate-700 dark:text-stone-300"
                >
                  {col.render ? col.render(row) : (row[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
