import { useState } from "react";
import { Field, SelectInput, TextInput } from "../common/Field";
import Modal from "../common/Modal";
import UserStatusBadge from "./UserStatusBadge";

const roleLabels = {
  ADMIN: "Admin",
  BASE_COMMANDER: "Base Commander",
  LOGISTICS_OFFICER: "Logistics Officer",
};

export default function UserForm({ user, bases, mode, saving, onSave, onClose }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "LOGISTICS_OFFICER",
    base: user?.base?.id || user?.base?._id || "",
    isActive: user?.isActive ?? true,
  });
  const [error, setError] = useState("");
  const readOnly = mode === "view";
  const isAdmin = form.role === "ADMIN";

  const setValue = (key) => (event) => {
    const value = key === "isActive" ? event.target.checked : event.target.value;
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "role" && value === "ADMIN" ? { base: "" } : {}),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    if (form.role !== "ADMIN" && !form.base) return setError("Choose a base for this role.");
    if (mode === "create" && form.password.length < 10) {
      return setError("Password must be at least 10 characters.");
    }
    if (form.password && form.password.length < 10) {
      return setError("Password must be at least 10 characters.");
    }

    try {
      const payload = { ...form, base: isAdmin ? null : form.base };
      if (!payload.password) delete payload.password;
      if (mode !== "create") delete payload.isActive;
      await onSave(payload);
    } catch (saveError) {
      setError(saveError.message || "Could not save this user.");
    }
  };

  return (
    <Modal
      title={mode === "create" ? "Create user" : mode === "edit" ? "Edit user" : "User details"}
      subtitle="Manage authorized personnel and their system access."
      onClose={onClose}
    >
      {readOnly ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Name", user.name],
            ["Email", user.email],
            ["Role", roleLabels[user.role] || user.role],
            ["Base", user.base?.name || "All bases"],
            ["Created", user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-slate-200 p-3 dark:border-stone-700"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-stone-400">
                {label}
              </p>
              <p className="mt-1 break-words text-sm font-semibold">{value}</p>
            </div>
          ))}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-stone-400">
              Status
            </p>
            <UserStatusBadge isActive={user.isActive} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg bg-olive-950 px-4 font-display font-bold uppercase tracking-wider text-white transition hover:bg-olive-800 sm:col-span-2"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <TextInput
              required
              maxLength={120}
              value={form.name}
              onChange={setValue("name")}
              readOnly={readOnly}
              placeholder="Full name"
            />
          </Field>
          <Field label="Email">
            <TextInput
              required
              type="email"
              maxLength={254}
              value={form.email}
              onChange={setValue("email")}
              readOnly={readOnly}
              placeholder="name@unit.mil"
            />
          </Field>
          <Field
            label={mode === "create" ? "Temporary password" : "New password (optional)"}
            className="sm:col-span-2"
            hint="At least 10 characters. Passwords are securely hashed before storage."
          >
            <TextInput
              required={mode === "create"}
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              value={form.password}
              onChange={setValue("password")}
              placeholder={
                mode === "create"
                  ? "Set an initial password"
                  : "Leave blank to keep current password"
              }
            />
          </Field>
          <Field label="Role">
            <SelectInput required value={form.role} onChange={setValue("role")}>
              <option value="ADMIN">Admin</option>
              <option value="BASE_COMMANDER">Base Commander</option>
              <option value="LOGISTICS_OFFICER">Logistics Officer</option>
            </SelectInput>
          </Field>
          <Field label="Base" hint={isAdmin ? "Administrators can access all bases." : undefined}>
            <SelectInput
              required={!isAdmin}
              disabled={isAdmin}
              value={isAdmin ? "" : form.base}
              onChange={setValue("base")}
            >
              <option value="">{isAdmin ? "All bases" : "Select a base"}</option>
              {bases.map((base) => (
                <option key={base._id} value={base._id}>
                  {base.name} ({base.code})
                </option>
              ))}
            </SelectInput>
          </Field>
          {mode === "create" && (
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-stone-200 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={setValue("isActive")}
                className="size-4 accent-amber-600"
              />
              Account is active
            </label>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-danger-700 dark:border-red-900 dark:bg-red-950/30 sm:col-span-2"
            >
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-stone-700 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg border border-slate-200 px-4 font-display font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="h-11 rounded-lg bg-amber-600 px-5 font-display font-bold uppercase tracking-wider text-olive-950 transition hover:bg-amber-500 disabled:opacity-60"
            >
              {saving ? "Saving…" : mode === "create" ? "Create user" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
