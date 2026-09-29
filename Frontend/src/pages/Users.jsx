import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Users as UsersIcon } from "lucide-react";
import toast from "react-hot-toast";
import PageHero from "../components/common/PageHero";
import SectionCard from "../components/common/SectionCard";
import { userService } from "../services/userService";
import { useAuth } from "../hooks/useAuth";
import { useBase } from "../hooks/useBase";
import DeleteUserDialog from "../components/users/DeleteUserDialog";
import UserFilters from "../components/users/UserFilters";
import UserForm from "../components/users/UserForm";
import UserTable from "../components/users/UserTable";

const emptyFilters = { search: "", role: "", base: "", status: "" };

export default function Users() {
  const { currentUser } = useAuth();
  const { bases } = useBase();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [formState, setFormState] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await userService.list({
        search: filters.search,
        role: filters.role,
        base: filters.base,
        status: filters.status,
      });
      setUsers(response.data || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeout = window.setTimeout(loadUsers, filters.search ? 250 : 0);
    return () => window.clearTimeout(timeout);
  }, [loadUsers, filters.search]);

  const saveUser = async (payload) => {
    setSaving(true);
    try {
      if (formState.mode === "edit") {
        await userService.update(formState.user.id || formState.user._id, payload);
        toast.success("User updated");
      } else {
        await userService.create(payload);
        toast.success("User created");
      }
      setFormState(null);
      await loadUsers();
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user) => {
    try {
      await userService.updateStatus(user.id || user._id, !user.isActive);
      toast.success(user.isActive ? "User deactivated" : "User activated");
      await loadUsers();
    } catch (statusError) {
      toast.error(statusError.message || "Could not update user status.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await userService.remove(deleteUser.id || deleteUser._id);
      toast.success("User deleted");
      setDeleteUser(null);
      await loadUsers();
    } catch (deleteError) {
      toast.error(deleteError.message || "Could not delete user.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHero title="Users" description="Manage authorized personnel and their system access." />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-stone-400">
          <UsersIcon size={17} className="text-amber-600" />
          <span>{loading ? "Loading directory…" : `${users.length} users`}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadUsers}
            aria-label="Refresh users"
            className="grid size-11 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-paper dark:border-stone-700 dark:bg-dark-900 dark:text-stone-300"
          >
            <RefreshCw size={17} />
          </button>
          <button
            type="button"
            onClick={() => setFormState({ mode: "create", user: null })}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-amber-600 px-4 font-display font-bold uppercase tracking-wider text-olive-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-500"
          >
            <Plus size={18} /> Create User
          </button>
        </div>
      </div>

      <div className="mb-5">
        <UserFilters filters={filters} bases={bases} onChange={setFilters} />
      </div>

      <SectionCard title="Authorized personnel" subtitle="User accounts and role assignments.">
        {error ? (
          <div className="grid min-h-40 place-items-center rounded-lg border border-red-200 bg-red-50 p-5 text-center dark:border-red-900 dark:bg-red-950/30">
            <div>
              <p role="alert" className="text-sm font-medium text-danger-700 dark:text-red-300">
                {error}
              </p>
              <button
                type="button"
                onClick={loadUsers}
                className="mt-3 font-display text-sm font-bold uppercase tracking-wider text-olive-900 underline dark:text-amber-300"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <UserTable
            users={users}
            loading={loading}
            currentUserId={currentUser?.id}
            onView={(user) => setFormState({ mode: "view", user })}
            onEdit={(user) => setFormState({ mode: "edit", user })}
            onToggle={toggleStatus}
            onDelete={setDeleteUser}
          />
        )}
      </SectionCard>

      {formState && (
        <UserForm
          key={`${formState.mode}-${formState.user?.id || "new"}`}
          mode={formState.mode}
          user={formState.user}
          bases={bases}
          saving={saving}
          onSave={saveUser}
          onClose={() => setFormState(null)}
        />
      )}
      <DeleteUserDialog
        user={deleteUser}
        deleting={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteUser(null)}
      />
    </>
  );
}
