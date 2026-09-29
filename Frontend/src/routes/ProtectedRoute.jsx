import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading)
    return (
      <div className="grid min-h-dvh place-items-center bg-paper text-sm text-olive-950 dark:bg-dark-950 dark:text-stone-100">
        Restoring secure session…
      </div>
    );
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
