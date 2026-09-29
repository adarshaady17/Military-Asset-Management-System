import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Boxes, PackageCheck } from "lucide-react";
import toast from "react-hot-toast";
import { resourceService } from "../services/resourceService";
import { useAuth } from "../hooks/useAuth";
import { useBase } from "../hooks/useBase";
import PageHero from "../components/common/PageHero";
import SectionCard from "../components/common/SectionCard";
import DataTable from "../components/common/DataTable";
import Modal from "../components/common/Modal";
import { Field, SelectInput, TextInput } from "../components/common/Field";

const amount = (value) => new Intl.NumberFormat("en-US").format(Number(value) || 0);
const dateValue = (value) => (value ? new Date(value).toLocaleString() : "—");
export default function Dashboard() {
  const { currentUser } = useAuth();
  const { selectedBase } = useBase();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [movementOpen, setMovementOpen] = useState(false);
  const [movement, setMovement] = useState(null);
  const base = selectedBase || currentUser?.base?.id || "";
  const filters = useMemo(
    () => ({
      ...(base ? { base } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(category ? { category } : {}),
    }),
    [base, from, to, category],
  );
  useEffect(() => {
    resourceService
      .list("equipment")
      .then((r) =>
        setCategories([...new Set((r.data || []).map((x) => x.category).filter(Boolean))]),
      )
      .catch(() => {});
  }, []);
  useEffect(() => {
    let live = true;
    setBusy(true);
    resourceService
      .dashboard(filters)
      .then((r) => {
        if (live) setData(r.data);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => live && setBusy(false));
    return () => {
      live = false;
    };
  }, [filters]);
  const audit = data?.recentActivity || [];
  const stats = data?.stats || {};
  const openMovement = async () => {
    try {
      const response = await resourceService.movement(filters);
      setMovement(response.data);
      setMovementOpen(true);
    } catch (error) {
      toast.error(error.message);
    }
  };
  const movementColumns = [
    {
      key: "equipment",
      label: "Equipment",
      render: (r) => <span className="font-semibold">{r.equipment?.name || "—"}</span>,
    },
    {
      key: "base",
      label: "Base",
      render: (r) => r.base?.name || r.fromBase?.name || r.toBase?.name || "—",
    },
    {
      key: "quantity",
      label: "Quantity",
      render: (r) => <span className="font-mono font-semibold">{amount(r.quantity)}</span>,
    },
    { key: "date", label: "Recorded", render: (r) => dateValue(r.purchaseDate || r.transferDate) },
  ];
  const items = [
    {
      title: "Opening Balance",
      value: stats.openingBalance,
      icon: Boxes,
      color: "text-olive-700",
      note: "Stock at start of date range",
    },
    {
      title: "Net Movement",
      value: stats.netMovement,
      icon: ArrowLeftRight,
      color: "text-amber-600",
      note: "Purchases + transfers in − out",
      click: openMovement,
    },
    {
      title: "Closing Balance",
      value: stats.closingBalance,
      icon: PackageCheck,
      color: "text-success-700",
      note: "Stock remaining after expenditures",
    },
    {
      title: "Assigned",
      value: stats.assigned,
      icon: ArrowUpRight,
      color: "text-slate-600",
      note: "Currently assigned; included in closing",
    },
    {
      title: "Expended",
      value: stats.expended,
      icon: ArrowDownLeft,
      color: "text-danger-700",
      note: "Recorded use",
    },
  ];
  const auditColumns = [
    { key: "user", label: "User", render: (r) => r.user?.name || "System" },
    {
      key: "action",
      label: "Action",
      render: (r) => <span className="font-semibold uppercase">{r.action}</span>,
    },
    { key: "module", label: "Module" },
    { key: "base", label: "Base", render: (r) => r.base?.name || "—" },
    { key: "entityId", label: "Record", render: (r) => String(r.entityId || "—").slice(-8) },
    { key: "createdAt", label: "Date / time", render: (r) => dateValue(r.createdAt) },
  ];
  return (
    <>
      <PageHero
        title="Asset Overview"
        description="Monitor inventory movement, assignments, and expenditures across your authorized bases."
      />
      <SectionCard
        title="Movement filters"
        subtitle="Set the reporting period and equipment category."
        className="mb-5 border-t-0"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="From date">
            <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To date">
            <TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="Equipment type">
            <SelectInput value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All equipment</option>
              {categories.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </SelectInput>
          </Field>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFrom("");
                setTo("");
                setCategory("");
              }}
              className="h-12 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-amber-600 hover:text-olive-950 dark:border-stone-700 dark:text-stone-300 dark:hover:text-white"
            >
              Clear filters
            </button>
          </div>
        </div>
      </SectionCard>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {items.map(({ title, value, icon: Icon, color, note, click }) => (
          <button
            key={title}
            onClick={click}
            disabled={!click}
            className="animate-fade-up rounded-xl border border-slate-200 border-t-[3px] border-t-amber-600 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg disabled:cursor-default dark:border-stone-800 dark:border-t-amber-600 dark:bg-dark-900 sm:p-5"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-bold uppercase tracking-[.12em] text-slate-500 dark:text-stone-400">
                {title}
              </span>
              <Icon size={20} className={color} />
            </div>
            <div className="mt-3 font-mono text-3xl font-semibold tracking-tight text-olive-950 dark:text-stone-100">
              {busy ? "…" : amount(value)}
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-stone-400">{note}</p>
          </button>
        ))}
      </div>
      <p className="mb-6 rounded-lg border border-olive-200 bg-olive-50/70 px-4 py-3 text-sm leading-6 text-olive-900 dark:border-stone-700 dark:bg-dark-900 dark:text-stone-300">
        <strong>How to read these totals:</strong> Opening Balance is stock at the beginning of
        the reporting period. Net Movement counts purchases and transfers only. Closing Balance
        is opening stock plus net movement minus expended items; items still assigned remain part
        of closing stock. The Assigned and Expended cards show current assignments and expenditure
        recorded during the selected period, respectively. When all equipment categories are
        selected, quantities are summed across different units; filter to one category for a
        comparable total.
      </p>
      <SectionCard
        title="Audit trail"
        subtitle={
          base
            ? "Recent recorded actions for the selected base."
            : "Recent recorded actions across all bases."
        }
        action={
          <span className="rounded-full bg-olive-950 px-3 py-1.5 font-display text-xs font-bold uppercase tracking-widest text-amber-300">
            {audit.length} actions
          </span>
        }
      >
        <DataTable
          columns={auditColumns}
          rows={audit}
          loading={!audit.length && busy}
          empty="No audited actions yet."
        />
      </SectionCard>
      {movementOpen && (
        <Modal
          title="Net movement"
          subtitle="Purchases + transfers in − transfers out"
          onClose={() => setMovementOpen(false)}
          wide
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { key: "purchases", title: "Purchases", color: "text-success-700" },
              { key: "transferIn", title: "Transfer In", color: "text-olive-700" },
              { key: "transferOut", title: "Transfer Out", color: "text-danger-700" },
            ].map((group) => {
              const rows = movement?.[group.key] || [];
              const total = rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
              return (
                <section
                  key={group.key}
                  className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-stone-700 dark:bg-dark-950"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-bold uppercase tracking-wider">
                      {group.title}
                    </h3>
                    <span
                      className={`rounded-full bg-paper px-3 py-1 font-mono text-sm font-semibold ${group.color} dark:bg-dark-900`}
                    >
                      {amount(total)}
                    </span>
                  </div>
                  <DataTable
                    columns={movementColumns}
                    rows={rows}
                    empty="No matching transactions."
                  />
                </section>
              );
            })}
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={() => setMovementOpen(false)}
              className="h-11 rounded-lg bg-olive-950 px-5 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:bg-olive-800"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
