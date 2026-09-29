import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Check, Route } from "lucide-react";
import toast from "react-hot-toast";
import { resourceService } from "../services/resourceService";
import { useAuth } from "../hooks/useAuth";
import { useBase } from "../hooks/useBase";
import PageHero from "../components/common/PageHero";
import SectionCard from "../components/common/SectionCard";
import DataTable from "../components/common/DataTable";
import { Field, SelectInput, TextInput } from "../components/common/Field";

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(Number(value) || 0);
export default function Transfers() {
  const { currentUser } = useAuth();
  const { bases, selectedBase } = useBase();
  const [equipment, setEquipment] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const lockedBase = selectedBase || currentUser?.base?.id || "";
  const [form, setForm] = useState({
    fromBase: lockedBase,
    toBase: "",
    equipment: "",
    quantity: "",
    transferDate: new Date().toISOString().slice(0, 10),
    referenceNumber: "",
    remarks: "",
  });
  useEffect(() => {
    setForm((f) => ({ ...f, fromBase: lockedBase }));
  }, [lockedBase]);
  useEffect(() => {
    resourceService
      .list("equipment")
      .then((r) => setEquipment(r.data || []))
      .catch((e) => toast.error(e.message));
  }, []);
  const reload = () => {
    setLoading(true);
    resourceService
      .list("transfers", { limit: 500 })
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
        const date = new Date(row.transferDate || row.createdAt);
        return (
          (!fromDate || date >= new Date(`${fromDate}T00:00:00`)) &&
          (!toDate || date <= new Date(`${toDate}T23:59:59`))
        );
      }),
    [rows, fromDate, toDate],
  );
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.fromBase === form.toBase) {
      setError("Source and destination bases must be different.");
      return;
    }
    if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 1) {
      setError("Quantity must be a whole number greater than zero.");
      return;
    }
    setSaving(true);
    try {
      await resourceService.create("transfers", {
        ...form,
        fromBase: lockedBase || form.fromBase,
        quantity: Number(form.quantity),
      });
      toast.success("Saved & logged");
      setForm((f) => ({
        ...f,
        toBase: "",
        equipment: "",
        quantity: "",
        referenceNumber: "",
        remarks: "",
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
    {
      key: "transferDate",
      label: "Timestamp",
      render: (r) => new Date(r.transferDate || r.createdAt).toLocaleString(),
    },
    {
      key: "fromBase",
      label: "From → To",
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <b>{r.fromBase?.name || "—"}</b>
          <ArrowLeftRight size={15} className="text-amber-600" />
          <b>{r.toBase?.name || "—"}</b>
        </span>
      ),
    },
    {
      key: "equipment",
      label: "Equipment",
      render: (r) => (
        <span>
          <span className="block font-semibold text-slate-800 dark:text-stone-100">
            {r.equipment?.name || "—"}
          </span>
          <span className="text-xs text-slate-500 dark:text-stone-400">
            {r.equipment?.assetTag || ""}
          </span>
        </span>
      ),
    },
    {
      key: "quantity",
      label: "Quantity",
      render: (r) => <span className="font-mono font-semibold">{formatNumber(r.quantity)}</span>,
    },
    { key: "referenceNumber", label: "Reference" },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold uppercase text-success-700 dark:bg-green-950/40">
          {r.status || "COMPLETED"}
        </span>
      ),
    },
  ];
  return (
    <>
      <PageHero
        title="Transfers"
        description="Move equipment between authorized bases with a verified, auditable movement record."
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(19rem,.72fr)_minmax(0,1.65fr)]">
        <SectionCard
          title="Execute transfer"
          subtitle="Available stock is checked before the transfer is saved."
        >
          <form onSubmit={submit} className="grid gap-4">
            <Field label="From base">
              <SelectInput
                required
                disabled={currentUser?.role !== "ADMIN"}
                value={currentUser?.role === "ADMIN" ? selectedBase || form.fromBase : lockedBase}
                onChange={(e) => setForm({ ...form, fromBase: e.target.value })}
              >
                <option value="">Select source base</option>
                {bases.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="To base">
              <SelectInput
                required
                value={form.toBase}
                onChange={(e) => setForm({ ...form, toBase: e.target.value })}
              >
                <option value="">Select destination base</option>
                {bases
                  .filter((b) => b._id !== (selectedBase || form.fromBase))
                  .map((b) => (
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
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="Enter quantity"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Field>
            <Field label="Transfer date">
              <TextInput
                required
                type="date"
                value={form.transferDate}
                onChange={(e) => setForm({ ...form, transferDate: e.target.value })}
              />
            </Field>
            <Field label="Reference number">
              <TextInput
                placeholder="Movement order (optional)"
                value={form.referenceNumber}
                onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
              />
            </Field>
            <Field label="Remarks">
              <TextInput
                placeholder="Additional details (optional)"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
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
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 font-display text-base font-bold uppercase tracking-[.12em] text-olive-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-500 disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? (
                "Saving…"
              ) : (
                <>
                  <Check size={17} /> Execute transfer
                </>
              )}
            </button>
          </form>
        </SectionCard>
        <SectionCard
          title="Transfer history"
          subtitle={`${filtered.length} movements`}
          action={<Route size={18} className="text-amber-600" />}
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Field label="From date">
              <TextInput
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </Field>
            <Field label="To date">
              <TextInput type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </Field>
          </div>
          <DataTable
            columns={columns}
            rows={filtered}
            loading={loading}
            empty="Inter-base transfers will appear here."
          />
        </SectionCard>
      </div>
    </>
  );
}
