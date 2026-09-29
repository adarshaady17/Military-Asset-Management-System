import { Eye, Pencil, Power, Trash2 } from "lucide-react";
import DataTable from "../common/DataTable";
import UserStatusBadge from "./UserStatusBadge";

const roles = {
  ADMIN: "Admin",
  BASE_COMMANDER: "Base Commander",
  LOGISTICS_OFFICER: "Logistics Officer",
};

export default function UserTable({
  users,
  loading,
  currentUserId,
  onView,
  onEdit,
  onToggle,
  onDelete,
}) {
  const columns = [
    {
      key: "name",
      label: "Name",
      render: (user) => (
        <p className="font-semibold text-olive-950 dark:text-stone-100">{user.name}</p>
      ),
    },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (user) => roles[user.role] || user.role },
    { key: "base", label: "Base", render: (user) => user.base?.name || "All bases" },
    {
      key: "isActive",
      label: "Status",
      render: (user) => <UserStatusBadge isActive={user.isActive} />,
    },
    {
      key: "createdAt",
      label: "Created date",
      render: (user) => (user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (user) => {
        const isSelf = user.id === currentUserId || user._id === currentUserId;
        return (
          <div className="flex items-center gap-1">
            <ActionButton label={`View ${user.name}`} onClick={() => onView(user)}>
              <Eye size={16} />
            </ActionButton>
            <ActionButton label={`Edit ${user.name}`} onClick={() => onEdit(user)}>
              <Pencil size={16} />
            </ActionButton>
            <ActionButton
              label={`${user.isActive ? "Deactivate" : "Activate"} ${user.name}`}
              disabled={isSelf}
              onClick={() => onToggle(user)}
              danger={user.isActive}
            >
              <Power size={16} />
            </ActionButton>
            <ActionButton
              label={`Delete ${user.name}`}
              disabled={isSelf}
              onClick={() => onDelete(user)}
              danger
            >
              <Trash2 size={16} />
            </ActionButton>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={users}
      rowKey="id"
      loading={loading}
      empty="No users match these filters."
    />
  );
}

function ActionButton({ label, children, onClick, disabled = false, danger = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-9 place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-30 ${
        danger
          ? "text-slate-500 hover:bg-red-50 hover:text-danger-700 dark:text-stone-400 dark:hover:bg-red-950/40"
          : "text-slate-500 hover:bg-amber-50 hover:text-olive-950 dark:text-stone-400 dark:hover:bg-stone-800"
      }`}
    >
      {children}
    </button>
  );
}
