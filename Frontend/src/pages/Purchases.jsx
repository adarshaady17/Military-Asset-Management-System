import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, Check } from "lucide-react";
import toast from "react-hot-toast";
import { resourceService } from "../services/resourceService";
import { useAuth } from "../hooks/useAuth";
import { useBase } from "../hooks/useBase";
import PageHero from "../components/common/PageHero";
import SectionCard from "../components/common/SectionCard";
import DataTable from "../components/common/DataTable";
import { Field, SelectInput, TextInput } from "../components/common/Field";

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(Number(value) || 0);
const dateShort = (value) => (value ? new Date(value).toLocaleDateString() : "—");
export default function Purchases() {
  const { currentUser } = useAuth();
  const { bases, selectedBase } = useBase();
  const [equipment, setEquipment] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterBase, setFilterBase] = useState("");
  const [filterType, setFilterType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [form, setForm] = useState({
    base: "",
    equipment: "",
    quantity: "",
    unitPrice: "",
    supplier: "",
    reference: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState("");
  const lockedBase = selectedBase || currentUser?.base?.id || "";
  const purchaseTotal = Number(form.quantity || 0) * Number(form.unitPrice || 0);
  useEffect(() => {
    resourceService
      .list("equipment")
      .then((r) => setEquipment(r.data || []))
      .catch((e) => toast.error(e.message));
  }, []);
  const reload = () => {
    setLoading(true);
    resourceService
      .list("purchases", { limit: 500 })
      .then((r) => setRows(r.data || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    reload();
  }, []);
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const date = new Date(row.purchaseDate || row.createdAt);
        return (
          (!filterBase || row.base?._id === filterBase) &&
          (!filterType || row.equipment?.category === filterType) &&
          (!from || date >= new Date(`${from}T00:00:00`)) &&
          (!to || date <= new Date(`${to}T23:59:59`))
        );
      }),
    [rows, filterBase, filterType, from, to],
  );
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 1) {
      setError("Quantity must be a whole number greater than zero.");
      return;
    }
    setSaving(true);
    try {
      await resourceService.create("purchases", {
        ...form,
        base: currentUser?.role === "ADMIN" ? selectedBase || form.base : lockedBase,
        quantity: Number(form.quantity),
      });
      toast.success("Saved & logged");
      setForm((f) => ({
        ...f,
        equipment: "",
        quantity: "",
        unitPrice: "",
        supplier: "",
        reference: "",
      }));
      await reload();
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };
  const columns = [
    { key: "purchaseDate", label: "Date", render: (r) => dateShort(r.purchaseDate || r.createdAt) },
    { key: "base", label: "Base", render: (r) => r.base?.name || "—" },
    {
      key: "equipment",
      label: "Equipment",
      render: (r) => (
        <span>
          <span className="block font-semibold text-slate-800 dark:text-stone-100">
            {r.equipment?.name || "—"}
          </span>
          <span className="text-xs text-slate-500 dark:text-stone-400">
            {r.equipment?.category || ""}
          </span>
        </span>
      ),
    },
    {
        key: "quantity",
      label: "Quantity",
      render: (r) => <span className="font-mono font-semibold">{formatNumber(r.quantity)}</span>,
    },
    {
      key: "unitPrice",
      label: "Unit price",
      render: (r) =>
        r.unitPrice === null || r.unitPrice === undefined
          ? "Not recorded"
          : Number(r.unitPrice).toFixed(2),
    },
    {
      key: "totalCost",
      label: "Total cost",
      render: (r) =>
        r.totalCost === null || r.totalCost === undefined
          ? "Not recorded"
          : Number(r.totalCost).toFixed(2),
    },
    { key: "supplier", label: "Supplier" },
    { key: "reference", label: "Reference" },
  ];
  return (
    <>
      <PageHero
        title="Purchases"
        description="Record new acquisitions and review verified procurement history."
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(18rem,.72fr)_minmax(0,1.65fr)]">
        <SectionCard
          title="Record purchase"
          subtitle="Purchased quantities are added to available inventory."
        >
          <form onSubmit={submit} className="grid gap-4">
            <Field label="Base">
              <SelectInput
                required={currentUser?.role === "ADMIN" && !selectedBase}
                disabled={currentUser?.role !== "ADMIN"}
                value={currentUser?.role === "ADMIN" ? selectedBase || form.base : lockedBase}
                onChange={(e) => setForm({ ...form, base: e.target.value })}
              >
                <option value="">Select base</option>
                {bases.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Equipment">
              <SelectInput
                required
                value={form.equipment}
                onChange={(e) => setForm({ ...form, equipment: e.target.value })}
              >
                <option value="">Select equipment</option>
                {equipment.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} · {item.category} · {item.assetTag}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Quantity">
              <TextInput
                required
                min="1"
                step="1"
                type="number"
                inputMode="numeric"
                placeholder="Enter units purchased"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Field>
            <Field label="Unit price" hint="Price per item; use your organization’s reporting currency.">
              <TextInput
                required
                min="0"
                step="0.01"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              />
            </Field>
            {form.quantity && form.unitPrice !== "" && (
              <p className="-mt-2 text-sm text-slate-500 dark:text-stone-400">
                Estimated total: <strong className="font-mono">{purchaseTotal.toFixed(2)}</strong>
              </p>
            )}
            <Field label="Purchase date">
              <TextInput
                required
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              />
            </Field>
            <Field label="Supplier">
              <TextInput
                placeholder="Supplier name (optional)"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              />
            </Field>
            <Field label="Reference number">
              <TextInput
                placeholder="Invoice or purchase order"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
              />
            </Field>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-danger-700 dark:bg-red-950/30"
              >
                {error}
              </p>
            )}
            <button
              disabled={saving}
              className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 font-display text-base font-bold uppercase tracking-[.12em] text-olive-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-500 disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? (
                "Saving…"
              ) : (
                <>
                  <Check size={17} /> Confirm purchase
                </>
              )}
            </button>
          </form>
        </SectionCard>
        <SectionCard
          title="Purchase history"
          subtitle={`${filtered.length} records · prices shown in the entered reporting currency`}
          action={<ArrowDownToLine size={18} className="text-amber-600" />}
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="From">
              <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To">
              <TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <Field label="Base">
              <SelectInput value={filterBase} onChange={(e) => setFilterBase(e.target.value)}>
                <option value="">All bases</option>
                {bases.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Equipment type">
              <SelectInput value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">All types</option>
                {[...new Set(equipment.map((item) => item.category))]
                  .filter(Boolean)
                  .map((value) => (
                    <option key={value}>{value}</option>
                  ))}
              </SelectInput>
            </Field>
          </div>
          <DataTable
            columns={columns}
            rows={filtered}
            loading={loading}
            empty="Purchases recorded for this filter will appear here."
          />
        </SectionCard>
      </div>
    </>
  );
}
