export default function UserStatusBadge({ isActive }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "bg-green-100 text-success-700 dark:bg-green-950/50 dark:text-green-300"
          : "bg-red-100 text-danger-700 dark:bg-red-950/50 dark:text-red-300"
      }`}
    >
      <span className={`size-1.5 rounded-full ${isActive ? "bg-success-700" : "bg-danger-700"}`} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
