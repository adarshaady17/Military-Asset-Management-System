import { Navigate, Route, Routes } from "react-router-dom";
import MamsLayout from "../components/layout/MamsLayout";
import Dashboard from "../pages/Dashboard";
import Purchases from "../pages/Purchases";
import Transfers from "../pages/Transfers";
import AssignExpend from "../pages/AssignExpend";
import Login from "../pages/Login";
import Unauthorized from "../pages/Unauthorized";
import Users from "../pages/Users";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MamsLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <RoleRoute path="/dashboard">
                <Dashboard />
              </RoleRoute>
            }
          />
          <Route
            path="purchases"
            element={
              <RoleRoute path="/purchases">
                <Purchases />
              </RoleRoute>
            }
          />
          <Route
            path="transfers"
            element={
              <RoleRoute path="/transfers">
                <Transfers />
              </RoleRoute>
            }
          />
          <Route
            path="assign-expend"
            element={
              <RoleRoute path="/assign-expend">
                <AssignExpend />
              </RoleRoute>
            }
          />
          <Route
            path="users"
            element={
              <RoleRoute path="/users">
                <Users />
              </RoleRoute>
            }
          />
          <Route path="*" element={<Navigate to="/unauthorized" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
