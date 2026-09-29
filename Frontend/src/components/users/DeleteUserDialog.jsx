import { AlertTriangle } from "lucide-react";
import Modal from "../common/Modal";

export default function DeleteUserDialog({ user, deleting, onConfirm, onClose }) {
  if (!user) return null;

  return (
    <Modal title="Delete user" subtitle="This action cannot be undone." onClose={onClose}>
      <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-danger-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
        <AlertTriangle className="mt-0.5 shrink-0" size={19} />
        <p className="text-sm leading-6">
          Permanently delete <strong>{user.name}</strong> ({user.email})? Their account will no
          longer be able to sign in.
        </p>
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-lg border border-slate-200 px-4 font-display font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={onConfirm}
          className="h-11 rounded-lg bg-danger-700 px-5 font-display font-bold uppercase tracking-wider text-white transition hover:bg-red-800 disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete user"}
        </button>
      </div>
    </Modal>
  );
}
