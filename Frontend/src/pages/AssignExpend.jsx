import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardCheck } from "lucide-react";
import toast from "react-hot-toast";
import { resourceService } from "../services/resourceService";
import { useAuth } from "../hooks/useAuth";
import { useBase } from "../hooks/useBase";
import PageHero from "../components/common/PageHero";
import SectionCard from "../components/common/SectionCard";
import DataTable from "../components/common/DataTable";
import { Field, SelectInput, TextInput } from "../components/common/Field";

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(Number(value) || 0);
export default function AssignExpend() {
  const { currentUser } = useAuth();
  const { bases, selectedBase } = useBase();
  const [equipment, setEquipment] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState("ASSIGN");
  const [filterAction, setFilterAction] = useState("ALL");
  const [error, setError] = useState("");
  const base = selectedBase || currentUser?.base?.id || "";
  const [form, setForm] = useState({
    base,
    equipment: "",
    quantity: "",
    personnelName: "",
    personnelId: "",
    assignedDate: new Date().toISOString().slice(0, 10),
    expenditureDate: new Date().toISOString().slice(0, 10),
    reason: "",
    authorizedBy: "",
    remarks: "",
  });
  useEffect(() => {
    setForm((f) => ({ ...f, base }));
  }, [base]);
  useEffect(() => {
    resourceService
      .list("equipment")
      .then((r) => setEquipment(r.data || []))
      .catch((e) => toast.error(e.message));
  }, []);
  const reload = () => {
    setLoading(true);
    Promise.all([
      resourceService.list("assignments", { limit: 500 }),
      resourceService.list("expenditures", { limit: 500 }),
    ])
      .then(([a, x]) =>
        setRows(
          [
            ...(a.data || []).map((row) => ({ ...row, recordType: "ASSIGN" })),
            ...(x.data || []).map((row) => ({ ...row, recordType: "EXPEND" })),
          ].sort(
            (a, b) =>
              new Date(b.assignedDate || b.expenditureDate || b.createdAt) -
              new Date(a.assignedDate || a.expenditureDate || a.createdAt),
          ),
        ),
      )
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    reload();
  }, []);
  const filtered = useMemo(
    () => rows.filter((row) => filterAction === "ALL" || row.recordType === filterAction),
    [rows, filterAction],
  );
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 1) {
      setError("Quantity must be a whole number greater than zero.");
      return;
    }
    const resource = action === "ASSIGN" ? "assignments" : "expenditures";
    const payload =
      action === "ASSIGN"
        ? {
            base,
            equipment: form.equipment,
            quantity: Number(form.quantity),
            personnelName: form.personnelName,
            personnelId: form.personnelId,
            assignedDate: form.assignedDate,
            remarks: form.remarks,
          }
        : {
            base,
            equipment: form.equipment,
            quantity: Number(form.quantity),
            reason: form.reason,
            authorizedBy: form.authorizedBy,
            expenditureDate: form.expenditureDate,
            remarks: form.remarks,
          };
    setSaving(true);
    try {
      await resourceService.create(resource, payload);
      toast.success("Saved & logged");
      setForm((f) => ({
        ...f,
        equipment: "",
        quantity: "",
        personnelName: "",
        personnelId: "",
        reason: "",
        authorizedBy: "",
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
      key: "date",
      label: "Date / time",
      render: (r) => new Date(r.assignedDate || r.expenditureDate || r.createdAt).toLocaleString(),
    },
    {
      key: "recordType",
      label: "Action",
      render: (r) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${r.recordType === "ASSIGN" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" : "bg-red-100 text-danger-700 dark:bg-red-950/40 dark:text-red-300"}`}
        >
          {r.recordType === "ASSIGN" ? "Assigned" : "Expended"}
        </span>
      ),
    },
    { key: "base", label: "Base", render: (r) => r.base?.name || "—" },
    {
      key: "equipment",
      label: "Equipment",
      render: (r) => <span className="font-semibold">{r.equipment?.name || "—"}</span>,
    },
    {
      key: "quantity",
      label: "Quantity",
      render: (r) => <span className="font-mono font-semibold">{formatNumber(r.quantity)}</span>,
    },
    {
      key: "personnel",
      label: "Personnel / reason",
      render: (r) =>
        r.recordType === "ASSIGN" ? (
          <span>
            {r.personnelName}
            <span className="block text-xs text-slate-500">{r.personnelId}</span>
          </span>
        ) : (
          r.reason
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${r.recordType === "ASSIGN" && r.status === "ACTIVE" ? "bg-green-50 text-success-700 dark:bg-green-950/40 dark:text-green-300" : "bg-slate-100 text-slate-600 dark:bg-stone-800 dark:text-stone-300"}`}
        >
          {r.recordType === "EXPEND" ? "Recorded" : r.status || "ACTIVE"}
        </span>
      ),
    },
  ];
  return (
    <>
      <PageHero
        title="Assign / Expend"
        description="Issue equipment to personnel or record authorized consumption against the base inventory."
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(19rem,.72fr)_minmax(0,1.65fr)]">
        <SectionCard
          title={action === "ASSIGN" ? "Assign equipment" : "Record expenditure"}
          subtitle={
            action === "ASSIGN"
              ? "Issue available stock to personnel or a unit."
              : "Record authorized use from the base stock."
          }
        >
          <form onSubmit={submit} className="grid gap-4">
            <Field label="Action">
              <SelectInput
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setError("");
                }}
              >
                <option value="ASSIGN">Assigned</option>
                <option value="EXPEND">Expended</option>
              </SelectInput>
            </Field>
            <Field label="Base">
              <SelectInput
                required={currentUser?.role === "ADMIN" && !base}
                disabled={currentUser?.role !== "ADMIN"}
                value={currentUser?.role === "ADMIN" ? base || form.base : base}
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
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="Enter units"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Field>
            {action === "ASSIGN" ? (
              <>
                <Field label="Personnel / unit">
                  <TextInput
                    required
                    placeholder="Name or unit"
                    value={form.personnelName}
                    onChange={(e) => setForm({ ...form, personnelName: e.target.value })}
                  />
                </Field>
                <Field label="Personnel ID / reference">
                  <TextInput
                    required
                    placeholder="Service ID or unit reference"
                    value={form.personnelId}
                    onChange={(e) => setForm({ ...form, personnelId: e.target.value })}
                  />
                </Field>
                <Field label="Assignment date">
                  <TextInput
                    type="date"
                    value={form.assignedDate}
                    onChange={(e) => setForm({ ...form, assignedDate: e.target.value })}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Reason">
                  <TextInput
                    required
                    placeholder="Reason for expenditure"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  />
                </Field>
                <Field label="Authorized by">
                  <TextInput
                    placeholder="Approving officer"
                    value={form.authorizedBy}
                    onChange={(e) => setForm({ ...form, authorizedBy: e.target.value })}
                  />
                </Field>
                <Field label="Expenditure date">
                  <TextInput
                    type="date"
                    value={form.expenditureDate}
                    onChange={(e) => setForm({ ...form, expenditureDate: e.target.value })}
                  />
                </Field>
              </>
            )}
            <Field label="Remarks">
              <TextInput
                placeholder="Optional details"
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
                  <Check size={17} /> Save record
                </>
              )}
            </button>
          </form>
        </SectionCard>
        <SectionCard
          title="Movement records"
          subtitle={`${filtered.length} recorded actions`}
          action={<ClipboardCheck size={18} className="text-amber-600" />}
        >
          <div className="mb-4 max-w-xs">
            <Field label="Filter action">
              <SelectInput value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                <option value="ALL">All activity</option>
                <option value="ASSIGN">Assigned</option>
                <option value="EXPEND">Expended</option>
              </SelectInput>
            </Field>
          </div>
          <DataTable
            columns={columns}
            rows={filtered}
            loading={loading}
            empty="Assignments and expenditures will appear here."
          />
        </SectionCard>
      </div>
    </>
  );
}
