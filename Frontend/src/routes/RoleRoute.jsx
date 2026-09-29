import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { permissions } from "../utils/permissions";
export default function RoleRoute({ path, children }) {
  const { currentUser } = useAuth();
  return permissions[currentUser?.role]?.includes(path) ? (
    children || <Outlet />
  ) : (
    <Navigate to="/unauthorized" replace />
  );
}
