import { useCallback, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { AuthContext } from "./AuthContextValue.js";

const TOKEN_KEY = "fieldops_token";
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));
  const refreshUser = useCallback(async () => {
    const savedToken = token || localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      setCurrentUser(null);
      return null;
    }
    try {
      const response = await authService.me();
      setCurrentUser(response.data);
      return response.data;
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setCurrentUser(null);
      throw error;
    }
  }, [token]);
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    refreshUser()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password);
    const nextToken = response.data.token;
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setCurrentUser(response.data.user);
    return response.data.user;
  }, []);
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setCurrentUser(null);
    }
  }, []);
  const value = useMemo(
    () => ({
      currentUser,
      token,
      isAuthenticated: Boolean(token && currentUser),
      loading,
      login,
      logout,
      refreshUser,
    }),
    [currentUser, token, loading, login, logout, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
